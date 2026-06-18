import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';

import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { ContractModel } from '../models/Contract.model';
import {
  FinancePlanModel,
  FinancePlanStrategy,
  IFinancePlanDocument,
} from '../models/FinancePlan.model';
import { FinancePlannedModel, IFinancePlannedDocument } from '../models/FinancePlanned.model';
import { FinancePlanVersionModel } from '../models/FinancePlanVersion.model';
import {
  computeKPIs,
  decimalToNumber,
  generatePaymentSchedule,
  generatePlan,
  roundMoney,
  serializePeriod,
  toDecimal,
  validateBalance,
} from '../services/finance-ai/planningService';

const allowedStrategies = new Set<FinancePlanStrategy>([
  'straight_line',
  's_curve',
  'milestone_weighted',
]);

function sendPlanningError(res: Response, err: unknown): boolean {
  const message = err instanceof Error ? err.message : 'planning_error';
  const errorMap: Record<string, number> = {
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
}

async function snapshotExistingPlan(
  plan: IFinancePlanDocument,
  periods: IFinancePlannedDocument[],
  userId: string,
) {
  const latestVersion = await FinancePlanVersionModel.findOne({ planId: plan._id })
    .sort({ versionNumber: -1 })
    .select('versionNumber');

  await FinancePlanVersionModel.create({
    planId: plan._id,
    contractId: plan.contractId,
    versionNumber: (latestVersion?.versionNumber || 0) + 1,
    snapshot: {
      plan: {
        id: plan._id,
        contractId: plan.contractId,
        strategy: plan.strategy,
        strategyParams: plan.strategyParams,
        totalAmount: decimalToNumber(plan.totalAmount),
        generatedAt: plan.generatedAt,
        generatedBy: plan.generatedBy,
        status: plan.status,
        warnings: plan.warnings,
      },
      periods: periods.map(serializePeriod),
    },
    replacedAt: new Date(),
    replacedBy: userId,
  });
}

async function getPlanWithPeriods(contractId: string) {
  const plan = await FinancePlanModel.findOne({ contractId });
  if (!plan) return null;

  const periods = await FinancePlannedModel.find({ planId: plan._id }).sort({ sortOrder: 1 });
  return { plan, periods };
}

function serializePlan(plan: IFinancePlanDocument) {
  return {
    id: plan._id,
    contractId: plan.contractId,
    strategy: plan.strategy,
    strategyParams: plan.strategyParams,
    totalAmount: roundMoney(decimalToNumber(plan.totalAmount)),
    generatedAt: plan.generatedAt,
    generatedBy: plan.generatedBy,
    status: plan.status,
    warnings: plan.warnings,
  };
}

export const generateFinancePlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contractId } = req.params;
    const { strategy, params = {} } = req.body as {
      strategy?: FinancePlanStrategy;
      params?: { kSteepness?: number };
    };

    if (!strategy || !allowedStrategies.has(strategy)) {
      res.status(400).json({ code: 'invalid_strategy', message: 'invalid_strategy' });
      return;
    }

    const contract = await ContractModel.findById(contractId);
    if (!contract) {
      res.status(404).json({ code: 'contract_not_found', message: 'Contract not found' });
      return;
    }
    if (contract.status !== 'active') {
      res.status(422).json({ code: 'contract_not_active', message: 'Contract is not active' });
      return;
    }

    const generated = generatePlan(contract, strategy, params);
    const existing = await getPlanWithPeriods(contractId);
    if (existing) {
      await snapshotExistingPlan(existing.plan, existing.periods, req.user!.id);
    }

    const plan = await FinancePlanModel.findOneAndUpdate(
      { contractId },
      {
        contractId,
        strategy: generated.strategy,
        strategyParams: generated.strategyParams,
        totalAmount: toDecimal(generated.totalAmount),
        generatedAt: new Date(),
        generatedBy: req.user!.id,
        status: 'draft',
        warnings: generated.warnings,
      },
      { new: true, upsert: true, runValidators: true },
    );

    await FinancePlannedModel.deleteMany({ planId: plan._id });
    const periods = await FinancePlannedModel.insertMany(
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

    res.status(201).json({
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

export const getFinancePlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(req.params.contractId);
    if (!contract) {
      res.status(404).json({ code: 'contract_not_found', message: 'Contract not found' });
      return;
    }

    const result = await getPlanWithPeriods(req.params.contractId);
    if (!result) {
      res.status(404).json({ code: 'plan_not_found', message: 'Plan not found' });
      return;
    }

    const periods = result.periods.map(serializePeriod);
    res.json({
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

export const updateFinancePlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contractId } = req.params;
    const { periods: inputPeriods } = req.body as {
      periods?: {
        periodLabel?: string;
        periodStart?: string;
        periodEnd?: string;
        plannedAmount?: number;
        sortOrder?: number;
      }[];
    };

    if (!Array.isArray(inputPeriods) || inputPeriods.length === 0) {
      res.status(400).json({ code: 'invalid_periods', message: 'periods array is required' });
      return;
    }

    const contract = await ContractModel.findById(contractId);
    if (!contract) {
      res.status(404).json({ code: 'contract_not_found', message: 'Contract not found' });
      return;
    }

    const result = await getPlanWithPeriods(contractId);
    if (!result) {
      res.status(404).json({ code: 'plan_not_found', message: 'Plan not found' });
      return;
    }

    const normalized = inputPeriods
      .map((period, index) => {
        const periodStart = new Date(period.periodStart || '');
        const periodEnd = new Date(period.periodEnd || '');
        const plannedAmount = Number(period.plannedAmount);
        if (
          !period.periodLabel ||
          Number.isNaN(periodStart.getTime()) ||
          Number.isNaN(periodEnd.getTime()) ||
          periodEnd < periodStart ||
          Number.isNaN(plannedAmount) ||
          plannedAmount < 0
        ) {
          throw new Error('invalid_periods');
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

    const validation = validateBalance(
      normalized.map((period) => period.plannedAmount),
      contract.contract_value || 0,
    );
    if (!validation.isValid) {
      res.status(400).json({
        code: 'balance_violation',
        message: validation.message,
        delta: validation.delta,
      });
      return;
    }

    await snapshotExistingPlan(result.plan, result.periods, req.user!.id);

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

    result.plan.status = 'draft';
    result.plan.generatedAt = new Date();
    result.plan.generatedBy = new Types.ObjectId(req.user!.id);
    result.plan.warnings = [];
    await result.plan.save();

    await FinancePlannedModel.deleteMany({ planId: result.plan._id });
    const savedPeriods = await FinancePlannedModel.insertMany(periodsToSave);
    const serializedPeriods = savedPeriods.map(serializePeriod);

    res.json({
      plan: serializePlan(result.plan),
      periods: serializedPeriods,
      kpis: computeKPIs(serializedPeriods, contract),
      warnings: [],
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'invalid_periods') {
      res.status(400).json({ code: 'invalid_periods', message: 'Invalid periods payload' });
      return;
    }
    if (sendPlanningError(res, err)) return;
    next(err);
  }
};

export const confirmFinancePlan = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const result = await getPlanWithPeriods(req.params.contractId);
    if (!result) {
      res.status(404).json({ code: 'plan_not_found', message: 'Plan not found' });
      return;
    }

    result.plan.status = 'confirmed';
    await result.plan.save();
    res.json({ plan: serializePlan(result.plan) });
  } catch (err) {
    next(err);
  }
};

export const getPaymentSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(req.params.contractId);
    if (!contract) {
      res.status(404).json({ code: 'contract_not_found', message: 'Contract not found' });
      return;
    }

    const result = await getPlanWithPeriods(req.params.contractId);
    if (!result) {
      res.status(404).json({ code: 'plan_not_found', message: 'Plan not found' });
      return;
    }

    res.json(generatePaymentSchedule(contract, result.plan, result.periods));
  } catch (err) {
    next(err);
  }
};
