import { Types } from 'mongoose';

import { IContractDocument } from '../../models/Contract.model';
import { FinancePlanStrategy, IPlanWarning } from '../../models/FinancePlan.model';
import { IFinancePlannedDocument } from '../../models/FinancePlanned.model';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BALANCE_TOLERANCE = 0.01;

export interface StrategyParams {
  kSteepness?: number;
}

export interface PlanningPeriod {
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  plannedAmount: number;
  cumulativePlanned: number;
  sortOrder: number;
}

export interface GeneratedPlan {
  strategy: FinancePlanStrategy;
  strategyParams: StrategyParams;
  totalAmount: number;
  periods: PlanningPeriod[];
  warnings: IPlanWarning[];
}

interface PlanningContract {
  _id: Types.ObjectId;
  contractValue: number;
  currency?: string;
  startDate: Date;
  endDate: Date;
  reportingPeriod: 'weekly' | 'monthly';
  milestones: {
    name?: string;
    dueDate?: Date;
    value?: number;
  }[];
}

export function decimalToNumber(value: Types.Decimal128 | number | undefined | null): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return Number.parseFloat(value.toString());
}

export function toDecimal(value: number): Types.Decimal128 {
  return Types.Decimal128.fromString(roundMoney(value).toFixed(2));
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalizeContract(contract: IContractDocument): PlanningContract {
  if (!contract.contract_value || contract.contract_value <= 0) {
    throw new Error('invalid_contract_value');
  }
  if (!contract.start_date || !contract.end_date) {
    throw new Error('missing_contract_dates');
  }
  if (!contract.reporting_period) {
    throw new Error('missing_reporting_period');
  }

  const startDate = new Date(contract.start_date);
  const endDate = new Date(contract.end_date);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    throw new Error('invalid_contract_dates');
  }

  return {
    _id: contract._id as Types.ObjectId,
    contractValue: contract.contract_value,
    currency: contract.currency || 'EGP',
    startDate,
    endDate,
    reportingPeriod: contract.reporting_period,
    milestones: (contract.milestones || []).map((milestone) => {
      const dueDate = milestone.due_date ? new Date(milestone.due_date) : undefined;
      const maybeValue = (milestone as { value?: unknown }).value;
      return {
        name: milestone.name,
        dueDate: dueDate && !Number.isNaN(dueDate.getTime()) ? dueDate : undefined,
        value: typeof maybeValue === 'number' ? maybeValue : undefined,
      };
    }),
  };
}

export function computeNumPeriods(
  startDate: Date,
  endDate: Date,
  reportingPeriod: 'weekly' | 'monthly',
): number {
  const days = (endDate.getTime() - startDate.getTime()) / MS_PER_DAY;
  if (reportingPeriod === 'weekly') return Math.ceil(days / 7);
  return Math.ceil(days / 30.44);
}

export function generateDateRanges(
  startDate: Date,
  periodCount: number,
  reportingPeriod: 'weekly' | 'monthly',
): { start: Date; end: Date }[] {
  const periodMs = reportingPeriod === 'weekly' ? 7 * MS_PER_DAY : 30.44 * MS_PER_DAY;
  return Array.from({ length: periodCount }, (_unused, index) => {
    const start = new Date(startDate.getTime() + index * periodMs);
    const end = new Date(start.getTime() + periodMs - MS_PER_DAY);
    return { start, end };
  });
}

function formatPeriodLabel(index: number, periodStart: Date, reportingPeriod: 'weekly' | 'monthly') {
  if (reportingPeriod === 'weekly') return `Week ${index + 1}`;
  return periodStart.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function straightLine(contractValue: number, periodCount: number): number[] {
  if (periodCount < 1) throw new Error('invalid_period_count');
  if (contractValue <= 0) throw new Error('invalid_contract_value');

  const share = contractValue / periodCount;
  const amounts = new Array(periodCount).fill(share);
  amounts[periodCount - 1] = contractValue - share * (periodCount - 1);
  return amounts;
}

export function sCurve(contractValue: number, periodCount: number, kSteepness = 6): number[] {
  if (periodCount < 1) throw new Error('invalid_period_count');
  if (contractValue <= 0) throw new Error('invalid_contract_value');

  const k = Math.max(3, Math.min(10, kSteepness));
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
  const progressStart = sigmoid(-k / 2);
  const progressEnd = sigmoid(k / 2);
  const progressRange = progressEnd - progressStart;
  const progress = (t: number) => (sigmoid(k * (t - 0.5)) - progressStart) / progressRange;

  const amounts = [];
  for (let i = 1; i <= periodCount; i++) {
    amounts.push(contractValue * (progress(i / periodCount) - progress((i - 1) / periodCount)));
  }

  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  amounts[periodCount - 1] += contractValue - total;
  return amounts;
}

function milestoneWeighted(
  contractValue: number,
  periodRanges: { start: Date; end: Date }[],
  milestones: PlanningContract['milestones'],
): { amounts: number[]; warnings: IPlanWarning[] } {
  const pricedMilestones = milestones.filter(
    (milestone) => milestone.value != null && milestone.value > 0 && milestone.dueDate,
  );

  if (pricedMilestones.length === 0) {
    return {
      amounts: sCurve(contractValue, periodRanges.length),
      warnings: [
        {
          code: 'milestone_fallback',
          message: 'No priced milestones were found, so milestone_weighted used s_curve instead.',
        },
      ],
    };
  }

  const totalMilestoneValue = pricedMilestones.reduce(
    (sum, milestone) => sum + (milestone.value || 0),
    0,
  );
  if (totalMilestoneValue > contractValue) {
    throw new Error('milestone_overweight');
  }

  const residual = contractValue - totalMilestoneValue;
  const basePeriodShare = residual / periodRanges.length;
  const warnings: IPlanWarning[] = pricedMilestones
    .filter((milestone) => {
      const dueDate = milestone.dueDate!;
      return !periodRanges.some((range) => dueDate >= range.start && dueDate <= range.end);
    })
    .map((milestone) => ({
      code: 'milestone_out_of_range',
      message: `Milestone "${milestone.name || 'Unnamed'}" is outside the generated period range.`,
    }));

  const amounts = periodRanges.map((range) => {
    const milestoneShare = pricedMilestones
      .filter((milestone) => {
        const dueDate = milestone.dueDate!;
        return dueDate >= range.start && dueDate <= range.end;
      })
      .reduce((sum, milestone) => sum + (milestone.value || 0), 0);
    return milestoneShare + basePeriodShare;
  });

  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  amounts[amounts.length - 1] += contractValue - total;

  return { amounts, warnings: dedupeWarnings(warnings) };
}

function dedupeWarnings(warnings: IPlanWarning[]): IPlanWarning[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = `${warning.code}:${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function assemblePeriods(
  amounts: number[],
  ranges: { start: Date; end: Date }[],
  reportingPeriod: 'weekly' | 'monthly',
): PlanningPeriod[] {
  let running = 0;
  return amounts.map((amount, index) => {
    running += amount;
    return {
      periodLabel: formatPeriodLabel(index, ranges[index].start, reportingPeriod),
      periodStart: ranges[index].start,
      periodEnd: ranges[index].end,
      plannedAmount: roundMoney(amount),
      cumulativePlanned: roundMoney(running),
      sortOrder: index,
    };
  });
}

export function validateBalance(amounts: number[], contractValue: number) {
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const delta = Math.abs(total - contractValue);
  return {
    isValid: delta <= BALANCE_TOLERANCE,
    delta,
    total,
    message:
      delta > BALANCE_TOLERANCE
        ? `Sum of period amounts (${roundMoney(total)}) does not match contract value (${roundMoney(contractValue)}).`
        : null,
  };
}

export function generatePlan(
  contract: IContractDocument,
  strategy: FinancePlanStrategy,
  params: StrategyParams = {},
): GeneratedPlan {
  const normalized = normalizeContract(contract);
  const periodCount = computeNumPeriods(
    normalized.startDate,
    normalized.endDate,
    normalized.reportingPeriod,
  );
  const ranges = generateDateRanges(normalized.startDate, periodCount, normalized.reportingPeriod);

  let amounts: number[];
  let warnings: IPlanWarning[] = [];
  const strategyParams: StrategyParams = {};

  if (strategy === 'straight_line') {
    amounts = straightLine(normalized.contractValue, periodCount);
  } else if (strategy === 's_curve') {
    strategyParams.kSteepness = Math.max(3, Math.min(10, params.kSteepness || 6));
    amounts = sCurve(normalized.contractValue, periodCount, strategyParams.kSteepness);
  } else if (strategy === 'milestone_weighted') {
    const result = milestoneWeighted(normalized.contractValue, ranges, normalized.milestones);
    amounts = result.amounts;
    warnings = result.warnings;
  } else {
    throw new Error('invalid_strategy');
  }

  const periods = assemblePeriods(amounts, ranges, normalized.reportingPeriod);
  const validation = validateBalance(
    periods.map((period) => period.plannedAmount),
    normalized.contractValue,
  );
  if (!validation.isValid) {
    throw new Error('balance_violation');
  }

  return {
    strategy,
    strategyParams,
    totalAmount: normalized.contractValue,
    periods,
    warnings,
  };
}

export function computeKPIs(periods: { cumulativePlanned: number }[], contract: IContractDocument) {
  const normalized = normalizeContract(contract);
  const peakCash = Math.max(...periods.map((period) => period.cumulativePlanned));
  const durationDays = (normalized.endDate.getTime() - normalized.startDate.getTime()) / MS_PER_DAY;
  const durationMonths = durationDays / 30.44;
  return {
    peakCash: roundMoney(peakCash),
    burnRate: roundMoney(normalized.contractValue / durationMonths),
  };
}

type SerializablePeriod = {
  _id?: unknown;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  plannedAmount: Types.Decimal128 | number;
  cumulativePlanned: Types.Decimal128 | number;
  sortOrder: number;
};

export function serializePeriod(period: SerializablePeriod) {
  return {
    id: period._id,
    periodLabel: period.periodLabel,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    plannedAmount: roundMoney(decimalToNumber(period.plannedAmount)),
    cumulativePlanned: roundMoney(decimalToNumber(period.cumulativePlanned)),
    sortOrder: period.sortOrder,
  };
}

export function generatePaymentSchedule(
  contract: IContractDocument,
  plan: { _id: Types.ObjectId; strategy: FinancePlanStrategy; generatedAt: Date },
  periods: IFinancePlannedDocument[],
) {
  const contractValue = contract.contract_value || 0;
  return {
    contractId: contract._id,
    planId: plan._id,
    strategy: plan.strategy,
    generatedAt: plan.generatedAt,
    totalAmount: roundMoney(contractValue),
    currency: contract.currency || 'EGP',
    paymentCount: periods.length,
    payments: periods.map((period, index) => {
      const amount = decimalToNumber(period.plannedAmount);
      return {
        paymentNumber: index + 1,
        periodLabel: period.periodLabel,
        periodStart: period.periodStart,
        dueDate: period.periodEnd,
        amount: roundMoney(amount),
        cumulativePayment: roundMoney(decimalToNumber(period.cumulativePlanned)),
        pctOfTotal: contractValue ? amount / contractValue : 0,
        description: `Payment ${index + 1}: planned for ${period.periodLabel}`,
      };
    }),
  };
}
