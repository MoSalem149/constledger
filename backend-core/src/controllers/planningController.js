import mongoose from "mongoose";

import Contract from "../models/Contract.js";
import FinancePlan from "../models/FinancePlan.js";
import FinancePlanned from "../models/FinancePlanned.js";
import FinancePlanVersion from "../models/FinancePlanVersion.js";
import { createFinancePlanWorkbook } from "../services/exportService.js";
import {
  computeKPIs,
  decimalToNumber,
  generatePaymentSchedule,
  generatePlan,
  roundMoney,
  serializePeriod,
  toDecimal,
  validateBalance,
} from "../services/planningService.js";

const allowedStrategies = new Set([
  "straight_line",
  "s_curve",
  "milestone_weighted",
]);

// Convert a FinancePlan document into the API shape (Decimal128 -> Number).
const serializePlan = (plan) => ({
  id: plan._id,
  contractId: plan.contractId,
  strategy: plan.strategy,
  strategyParams: plan.strategyParams,
  totalAmount: roundMoney(decimalToNumber(plan.totalAmount)),
  generatedAt: plan.generatedAt,
  generatedBy: plan.generatedBy,
  status: plan.status,
  warnings: plan.warnings,
});

// Map domain error codes thrown by planningService into HTTP status codes.
// Returns true if it sent a response, false to let the caller delegate to next(err).
const sendPlanningError = (res, err) => {
  const message = err instanceof Error ? err.message : "planning_error";
  const errorMap = {
    invalid_strategy: 400,
    milestone_overweight: 400,
    balance_violation: 400,
    invalid_contract_value: 422,
    invalid_contract_dates: 422,
    missing_contract_dates: 422,
    missing_reporting_period: 422,
    invalid_period_count: 422,
  };

  const statusCode = errorMap[message];
  if (!statusCode) return false;

  res.status(statusCode).json({ code: message, message });
  return true;
};

const getPlanWithPeriods = async (contractId) => {
  const plan = await FinancePlan.findOne({ contractId });
  if (!plan) return null;

  const periods = await FinancePlanned.find({ planId: plan._id }).sort({
    sortOrder: 1,
  });
  return { plan, periods };
};

// Before mutating a plan, write the current state into FinancePlanVersion
// for audit / rollback. Version numbers are monotonically increasing per plan.
const snapshotExistingPlan = async (plan, periods, userId) => {
  const latestVersion = await FinancePlanVersion.findOne({ planId: plan._id })
    .sort({ versionNumber: -1 })
    .select("versionNumber");

  await FinancePlanVersion.create({
    planId: plan._id,
    contractId: plan.contractId,
    versionNumber: (latestVersion?.versionNumber || 0) + 1,
    snapshot: {
      plan: serializePlan(plan),
      periods: periods.map(serializePeriod),
    },
    replacedAt: new Date(),
    replacedBy: userId,
  });
};

// POST /api/finance/:contractId/plans/generate
// Generates (or regenerates) a finance plan using a strategy. If a plan already
// exists, the previous version is snapshotted before being replaced.
export const generateFinancePlan = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { strategy, params = {} } = req.body;

    if (!strategy || !allowedStrategies.has(strategy)) {
      return res
        .status(400)
        .json({ code: "invalid_strategy", message: "invalid_strategy" });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res
        .status(404)
        .json({ code: "contract_not_found", message: "Contract not found" });
    }
    if (contract.status !== "active") {
      return res.status(422).json({
        code: "contract_not_active",
        message: "Contract is not active",
      });
    }

    const generated = generatePlan(contract, strategy, params);

    // Snapshot the existing plan (if any) before overwriting it
    const existing = await getPlanWithPeriods(contractId);
    if (existing) {
      await snapshotExistingPlan(existing.plan, existing.periods, req.user._id);
    }

    // Upsert the plan header
    const plan = await FinancePlan.findOneAndUpdate(
      { contractId },
      {
        contractId,
        strategy: generated.strategy,
        strategyParams: generated.strategyParams,
        totalAmount: toDecimal(generated.totalAmount),
        generatedAt: new Date(),
        generatedBy: req.user._id,
        status: "draft",
        warnings: generated.warnings,
      },
      { new: true, upsert: true, runValidators: true },
    );

    // Replace the period rows wholesale
    await FinancePlanned.deleteMany({ planId: plan._id });
    const periods = await FinancePlanned.insertMany(
      generated.periods.map((period) => ({
        planId: plan._id,
        contractId,
        periodLabel: period.periodLabel,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        plannedAmount: toDecimal(period.plannedAmount),
        cumulativePlanned: toDecimal(period.cumulativePlanned),
        sortOrder: period.sortOrder,
      })),
    );

    return res.status(201).json({
      plan: serializePlan(plan),
      periods: periods.map(serializePeriod),
      kpis: computeKPIs(generated.periods, contract),
      warnings: generated.warnings,
    });
  } catch (err) {
    if (sendPlanningError(res, err)) return;
    next(err);
  }
};

// GET /api/finance/:contractId/plan
export const getFinancePlan = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) {
      return res
        .status(404)
        .json({ code: "contract_not_found", message: "Contract not found" });
    }

    const result = await getPlanWithPeriods(req.params.contractId);
    if (!result) {
      return res
        .status(404)
        .json({ code: "plan_not_found", message: "Plan not found" });
    }

    const periods = result.periods.map(serializePeriod);
    return res.json({
      plan: serializePlan(result.plan),
      periods,
      kpis: computeKPIs(periods, contract),
      warnings: result.plan.warnings,
    });
  } catch (err) {
    if (sendPlanningError(res, err)) return;
    next(err);
  }
};

// PUT /api/finance/:contractId/plan
// Manual edit of plan periods. Validates each period and enforces that the sum
// of plannedAmount equals contract_value within tolerance before persisting.
export const updateFinancePlan = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { periods: inputPeriods } = req.body;

    if (!Array.isArray(inputPeriods) || inputPeriods.length === 0) {
      return res.status(400).json({
        code: "invalid_periods",
        message: "periods array is required",
      });
    }

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res
        .status(404)
        .json({ code: "contract_not_found", message: "Contract not found" });
    }

    const result = await getPlanWithPeriods(contractId);
    if (!result) {
      return res
        .status(404)
        .json({ code: "plan_not_found", message: "Plan not found" });
    }

    // Validate each period row, then sort by sortOrder so cumulative math is correct
    const normalized = inputPeriods
      .map((period, index) => {
        const periodStart = new Date(period.periodStart || "");
        const periodEnd = new Date(period.periodEnd || "");
        const plannedAmount = Number(period.plannedAmount);
        if (
          !period.periodLabel ||
          Number.isNaN(periodStart.getTime()) ||
          Number.isNaN(periodEnd.getTime()) ||
          periodEnd < periodStart ||
          Number.isNaN(plannedAmount) ||
          plannedAmount < 0
        ) {
          throw new Error("invalid_periods");
        }
        return {
          periodLabel: period.periodLabel,
          periodStart,
          periodEnd,
          plannedAmount: roundMoney(plannedAmount),
          sortOrder: period.sortOrder ?? index,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    // The sum of all period amounts MUST equal the contract value (tolerance 0.01).
    const validation = validateBalance(
      normalized.map((period) => period.plannedAmount),
      contract.contract_value || 0,
    );
    if (!validation.isValid) {
      return res.status(400).json({
        code: "balance_violation",
        message: validation.message,
        delta: validation.delta,
      });
    }

    // Snapshot the old plan, then rebuild period rows with running cumulatives
    await snapshotExistingPlan(result.plan, result.periods, req.user._id);

    let running = 0;
    const periodsToSave = normalized.map((period, index) => {
      running += period.plannedAmount;
      return {
        planId: result.plan._id,
        contractId,
        periodLabel: period.periodLabel,
        periodStart: period.periodStart,
        periodEnd: period.periodEnd,
        plannedAmount: toDecimal(period.plannedAmount),
        cumulativePlanned: toDecimal(running),
        sortOrder: index,
      };
    });

    // Manual edits drop the plan back to draft and clear prior warnings
    result.plan.status = "draft";
    result.plan.generatedAt = new Date();
    result.plan.generatedBy = new mongoose.Types.ObjectId(req.user._id);
    result.plan.warnings = [];
    await result.plan.save();

    await FinancePlanned.deleteMany({ planId: result.plan._id });
    const savedPeriods = await FinancePlanned.insertMany(periodsToSave);
    const serializedPeriods = savedPeriods.map(serializePeriod);

    return res.json({
      plan: serializePlan(result.plan),
      periods: serializedPeriods,
      kpis: computeKPIs(serializedPeriods, contract),
      warnings: [],
    });
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_periods") {
      return res
        .status(400)
        .json({ code: "invalid_periods", message: "Invalid periods payload" });
    }
    if (sendPlanningError(res, err)) return;
    next(err);
  }
};

// POST /api/finance/:contractId/plan/confirm — moves status draft -> confirmed.
// Reports endpoints only operate on confirmed plans.
export const confirmFinancePlan = async (req, res, next) => {
  try {
    const result = await getPlanWithPeriods(req.params.contractId);
    if (!result) {
      return res
        .status(404)
        .json({ code: "plan_not_found", message: "Plan not found" });
    }

    result.plan.status = "confirmed";
    await result.plan.save();
    return res.json({ plan: serializePlan(result.plan) });
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/:contractId/plan/export — XLSX download
export const exportFinancePlan = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) {
      return res
        .status(404)
        .json({ code: "contract_not_found", message: "Contract not found" });
    }

    const result = await getPlanWithPeriods(req.params.contractId);
    if (!result) {
      return res
        .status(404)
        .json({ code: "plan_not_found", message: "Plan not found" });
    }

    const workbook = createFinancePlanWorkbook(contract, result);
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="finance-plan-${req.params.contractId}.xlsx"`,
    );
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// GET /api/finance/:contractId/payment-schedule
export const getPaymentSchedule = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.contractId);
    if (!contract) {
      return res
        .status(404)
        .json({ code: "contract_not_found", message: "Contract not found" });
    }

    const result = await getPlanWithPeriods(req.params.contractId);
    if (!result) {
      return res
        .status(404)
        .json({ code: "plan_not_found", message: "Plan not found" });
    }

    return res.json(
      generatePaymentSchedule(contract, result.plan, result.periods),
    );
  } catch (err) {
    next(err);
  }
};
