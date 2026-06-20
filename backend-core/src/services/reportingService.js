import mongoose from "mongoose";

import Contract from "../models/Contract.js";
import FinancePlan from "../models/FinancePlan.js";
import FinancePlanned from "../models/FinancePlanned.js";
import {
  computeKPIs,
  decimalToNumber,
  generatePaymentSchedule,
  roundMoney,
  serializePeriod,
} from "./planningService.js";

const CONTRACT_STATUSES = new Set([
  "processing",
  "analysis_failed",
  "pending_review",
  "active",
]);

// Typed error — the report controller checks instanceof and forwards
// statusCode + code straight to the HTTP response.
export class ReportError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.name = "ReportError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Validate the 24-hex Mongo ObjectId before round-tripping to the DB so we
// can return 400 instead of a generic 500 on malformed input.
export const parseContractId = (contractId) => {
  if (
    typeof contractId !== "string" ||
    !/^[a-f\d]{24}$/i.test(contractId) ||
    !mongoose.Types.ObjectId.isValid(contractId)
  ) {
    throw new ReportError(400, "invalid_contract_id", "Invalid contract ID");
  }
  return contractId;
};

export const parseOptionalYear = (yearInput) => {
  if (yearInput === undefined || yearInput === null || yearInput === "") {
    return null;
  }

  const yearText =
    typeof yearInput === "string" ? yearInput : String(yearInput);
  if (!/^\d{4}$/.test(yearText)) {
    throw new ReportError(
      400,
      "invalid_year",
      "Year must use YYYY format",
    );
  }

  const year = Number(yearText);
  if (year < 1000 || year > 9999) {
    throw new ReportError(
      400,
      "invalid_year",
      "Year must use YYYY format",
    );
  }
  return year;
};

export const parseOptionalContractStatus = (statusInput) => {
  if (statusInput === undefined || statusInput === null || statusInput === "") {
    return null;
  }
  if (
    typeof statusInput !== "string" ||
    !CONTRACT_STATUSES.has(statusInput)
  ) {
    throw new ReportError(
      400,
      "invalid_status",
      "Invalid contract status",
    );
  }
  return statusInput;
};

// Planned-budget filters — both contractId and year are required, and year
// becomes a UTC [Jan 1, next Jan 1) interval used to scope the period query.
export const parsePlannedBudgetFilters = (contractId, yearInput) => {
  const validatedContractId = parseContractId(contractId);
  const year = parseOptionalYear(yearInput);
  if (year === null) {
    throw new ReportError(
      400,
      "invalid_year",
      "Year is required in YYYY format",
    );
  }

  return {
    contractId: validatedContractId,
    year,
    startDate: new Date(Date.UTC(year, 0, 1)),
    endDate: new Date(Date.UTC(year + 1, 0, 1)),
  };
};

// Shape one year of planned-budget data for the API & XLSX export
export const buildPlannedBudgetReport = (contract, plan, periods, year) => {
  const contractValue = roundMoney(Number(contract.contract_value) || 0);
  const serializedPeriods = periods.map((period) => {
    const serialized = serializePeriod(period);
    return {
      ...serialized,
      percentageOfContract:
        contractValue > 0
          ? roundMoney((serialized.plannedAmount / contractValue) * 100)
          : 0,
    };
  });
  const yearlyPlannedTotal = roundMoney(
    serializedPeriods.reduce(
      (total, period) => total + period.plannedAmount,
      0,
    ),
  );

  return {
    contract: {
      id: String(contract._id),
      contractNumber: contract.contractNumber || null,
      name: contract.name,
      currency: contract.currency || "EGP",
      contractValue,
      startDate: contract.start_date || null,
      endDate: contract.end_date || null,
    },
    plan: {
      id: String(plan._id),
      strategy: plan.strategy,
      status: plan.status,
      generatedAt: plan.generatedAt,
    },
    year,
    periodCount: serializedPeriods.length,
    yearlyPlannedTotal,
    yearlyPercentageOfContract:
      contractValue > 0
        ? roundMoney((yearlyPlannedTotal / contractValue) * 100)
        : 0,
    periods: serializedPeriods,
  };
};

// Reporting endpoints REJECT draft plans — only confirmed plans roll up into reports.
export const assertConfirmedReportPlan = (plan) => {
  if (!plan) {
    throw new ReportError(404, "plan_not_found", "Plan not found");
  }
  if (plan.status !== "confirmed") {
    throw new ReportError(
      409,
      "plan_not_confirmed",
      "Finance plan must be confirmed before it can be reported",
    );
  }
};

const serializeReportPlan = (plan) => ({
  id: String(plan._id),
  strategy: plan.strategy,
  strategyParams: plan.strategyParams || {},
  totalAmount: roundMoney(decimalToNumber(plan.totalAmount)),
  generatedAt: plan.generatedAt,
  status: plan.status,
  warnings: plan.warnings || [],
});

const serializeContractSummary = (contract) => ({
  id: String(contract._id),
  contractNumber: contract.contractNumber || null,
  name: contract.name,
  contractValue: roundMoney(Number(contract.contract_value) || 0),
  currency: contract.currency || "EGP",
  status: contract.status,
  parties: (contract.parties || []).map((party) => ({
    name: party.name || null,
    role: party.role || null,
  })),
  startDate: contract.start_date || null,
  endDate: contract.end_date || null,
  durationDays: contract.duration_days ?? null,
  reportingPeriod: contract.reporting_period || null,
});

// Aggregate contracts into per-currency totals (contract count + value sum).
// Used by both the JSON response and the XLSX summary section.
export const buildAllContractsReport = (contracts, filters) => {
  const rows = contracts.map(serializeContractSummary);
  const totalsByCurrencyMap = new Map();

  rows.forEach((contract) => {
    const current = totalsByCurrencyMap.get(contract.currency) || {
      currency: contract.currency,
      contractCount: 0,
      totalValue: 0,
    };
    current.contractCount += 1;
    current.totalValue = roundMoney(
      current.totalValue + contract.contractValue,
    );
    totalsByCurrencyMap.set(contract.currency, current);
  });

  return {
    filters: {
      year: filters.year,
      status: filters.status,
    },
    contractCount: rows.length,
    totalsByCurrency: [...totalsByCurrencyMap.values()].sort((a, b) =>
      a.currency.localeCompare(b.currency),
    ),
    contracts: rows,
  };
};

export const getAllContractsReport = async (yearInput, statusInput) => {
  const year = parseOptionalYear(yearInput);
  const status = parseOptionalContractStatus(statusInput);
  const filter = {};

  if (status) filter.status = status;

  // Year filter — contracts whose execution window overlaps the requested year
  // (start_date <= year-end AND end_date >= year-start).
  if (year !== null) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    filter.start_date = { $lte: yearEnd };
    filter.end_date = { $gte: yearStart };
  }

  const contracts = await Contract.find(filter)
    .select(
      "_id contractNumber name contract_value currency status parties start_date end_date duration_days reporting_period",
    )
    .sort({ start_date: 1, name: 1 })
    .lean();

  return buildAllContractsReport(contracts, { year, status });
};

// Common loader — validate contract id, load the contract & its CONFIRMED
// plan, and load the ordered period rows. Used by payment schedule and
// project summary reports.
const loadConfirmedPlanReportData = async (contractId) => {
  const validatedContractId = parseContractId(contractId);
  const contract = await Contract.findById(validatedContractId);
  if (!contract) {
    throw new ReportError(404, "contract_not_found", "Contract not found");
  }

  const plan = await FinancePlan.findOne({ contractId: validatedContractId });
  assertConfirmedReportPlan(plan);

  const periods = await FinancePlanned.find({
    planId: plan._id,
    contractId: validatedContractId,
  }).sort({ sortOrder: 1, periodStart: 1 });

  return { contract, plan, periods };
};

export const buildPaymentScheduleReport = (contract, plan, periods) => ({
  contract: serializeContractSummary(contract),
  plan: serializeReportPlan(plan),
  schedule: generatePaymentSchedule(contract, plan, periods),
});

export const getPaymentScheduleReport = async (contractId) => {
  const { contract, plan, periods } =
    await loadConfirmedPlanReportData(contractId);
  return buildPaymentScheduleReport(contract, plan, periods);
};

// Project summary — contract + plan + periods + KPIs + payment schedule in one shape
export const buildProjectSummaryReport = (contract, plan, periods) => {
  const serializedPeriods = periods.map(serializePeriod);
  return {
    contract: serializeContractSummary(contract),
    plan: serializeReportPlan(plan),
    periods: serializedPeriods,
    kpis: computeKPIs(serializedPeriods, contract),
    paymentSchedule: generatePaymentSchedule(contract, plan, periods),
  };
};

export const getProjectSummaryReport = async (contractId) => {
  const { contract, plan, periods } =
    await loadConfirmedPlanReportData(contractId);
  return buildProjectSummaryReport(contract, plan, periods);
};

export const getPlannedBudgetReport = async (contractId, yearInput) => {
  const filters = parsePlannedBudgetFilters(contractId, yearInput);

  const contract = await Contract.findById(filters.contractId);
  if (!contract) {
    throw new ReportError(404, "contract_not_found", "Contract not found");
  }

  const plan = await FinancePlan.findOne({ contractId: filters.contractId });
  assertConfirmedReportPlan(plan);

  // Only periods whose periodStart falls in the requested year
  const periods = await FinancePlanned.find({
    planId: plan._id,
    contractId: filters.contractId,
    periodStart: {
      $gte: filters.startDate,
      $lt: filters.endDate,
    },
  }).sort({ sortOrder: 1, periodStart: 1 });

  return buildPlannedBudgetReport(contract, plan, periods, filters.year);
};
