import mongoose from "mongoose";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BALANCE_TOLERANCE = 0.01;

export const decimalToNumber = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number.parseFloat(value.toString());
};

export const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const toDecimal = (value) =>
  mongoose.Types.Decimal128.fromString(roundMoney(value).toFixed(2));

const parseMilestoneDate = (milestone) => {
  const rawDate = milestone.due_date ?? milestone.dueDate;
  if (!rawDate) return undefined;

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const parseMilestoneValue = (value) => {
  if (value == null || value === "") return undefined;

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.replace(/,/g, ""))
        : value instanceof mongoose.Types.Decimal128
          ? Number.parseFloat(value.toString())
          : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeReportingPeriod = (value) => {
  if (!value) return undefined;

  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "weekly") return "weekly";
  if (
    normalized === "biweekly" ||
    normalized === "2 weeks" ||
    normalized === "2-weekly" ||
    normalized === "2-weeks" ||
    normalized === "15 days" ||
    normalized === "15-day" ||
    normalized === "15days"
  )
    return "biweekly";
  if (normalized === "monthly") return "monthly";
  return undefined;
};

export const normalizeContract = (contract) => {
  if (!contract.contract_value || contract.contract_value <= 0) {
    throw new Error("invalid_contract_value");
  }
  if (!contract.start_date || !contract.end_date) {
    throw new Error("missing_contract_dates");
  }
  if (!contract.reporting_period) {
    throw new Error("missing_reporting_period");
  }

  const startDate = new Date(contract.start_date);
  const endDate = new Date(contract.end_date);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate <= startDate
  ) {
    throw new Error("invalid_contract_dates");
  }

  const reportingPeriod = normalizeReportingPeriod(contract.reporting_period);
  if (!reportingPeriod) {
    throw new Error("invalid_reporting_period");
  }

  return {
    id: contract._id,
    contractValue: contract.contract_value,
    currency: contract.currency || "EGP",
    startDate,
    endDate,
    reportingPeriod,
    milestones: (contract.milestones || []).map((milestone) => ({
      name: milestone.name,
      dueDate: parseMilestoneDate(milestone),
      value: parseMilestoneValue(milestone.value),
      hasRawValue: milestone.value != null && milestone.value !== "",
    })),
  };
};

export const computeNumPeriods = (startDate, endDate, reportingPeriod) => {
  const days = (endDate.getTime() - startDate.getTime()) / MS_PER_DAY;
  if (reportingPeriod === "weekly") return Math.ceil(days / 7);
  if (reportingPeriod === "biweekly") return Math.ceil(days / 15);
  return Math.ceil(days / 30.44);
};

export const generateDateRanges = (startDate, periodCount, reportingPeriod) => {
  const periodMs =
    reportingPeriod === "weekly"
      ? 7 * MS_PER_DAY
      : reportingPeriod === "biweekly"
        ? 15 * MS_PER_DAY
        : 30.44 * MS_PER_DAY;
  return Array.from({ length: periodCount }, (_unused, index) => {
    const start = new Date(startDate.getTime() + index * periodMs);
    const end = new Date(start.getTime() + periodMs - MS_PER_DAY);
    return { start, end };
  });
};

const formatPeriodLabel = (index, periodStart, reportingPeriod) => {
  if (reportingPeriod === "weekly") return `Week ${index + 1}`;
  if (reportingPeriod === "biweekly") return `Biweekly ${index + 1}`;
  return periodStart.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
};

export const straightLine = (contractValue, periodCount) => {
  if (periodCount < 1) throw new Error("invalid_period_count");
  if (contractValue <= 0) throw new Error("invalid_contract_value");

  const share = contractValue / periodCount;
  const amounts = new Array(periodCount).fill(share);
  amounts[periodCount - 1] = contractValue - share * (periodCount - 1);
  return amounts;
};

export const sCurve = (contractValue, periodCount, kSteepness = 6) => {
  if (periodCount < 1) throw new Error("invalid_period_count");
  if (contractValue <= 0) throw new Error("invalid_contract_value");

  const k = Math.max(3, Math.min(10, kSteepness));
  const sigmoid = (x) => 1 / (1 + Math.exp(-x));
  const progressStart = sigmoid(-k / 2);
  const progressEnd = sigmoid(k / 2);
  const progressRange = progressEnd - progressStart;
  const progress = (t) =>
    (sigmoid(k * (t - 0.5)) - progressStart) / progressRange;

  const amounts = [];
  for (let i = 1; i <= periodCount; i += 1) {
    amounts.push(
      contractValue *
        (progress(i / periodCount) - progress((i - 1) / periodCount)),
    );
  }

  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  amounts[periodCount - 1] += contractValue - total;
  return amounts;
};

const dedupeWarnings = (warnings) => {
  const seen = new Set();
  return warnings.filter((warning) => {
    const key = `${warning.code}:${warning.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const milestoneWeighted = (contractValue, periodRanges, milestones) => {
  const ignoredWarnings = milestones
    .filter(
      (milestone) =>
        milestone.hasRawValue && (!milestone.value || !milestone.dueDate),
    )
    .map((milestone) => ({
      code: "milestone_ignored",
      message: `Milestone "${milestone.name || "Unnamed"}" has a value but no valid due date or positive amount.`,
    }));

  const pricedMilestones = milestones.filter(
    (milestone) => milestone.value && milestone.dueDate,
  );
  const inRangePricedMilestones = pricedMilestones.filter((milestone) => {
    const dueDate = milestone.dueDate;
    return periodRanges.some(
      (range) => dueDate >= range.start && dueDate <= range.end,
    );
  });
  const outOfRangeWarnings = pricedMilestones
    .filter((milestone) => !inRangePricedMilestones.includes(milestone))
    .map((milestone) => ({
      code: "milestone_out_of_range",
      message: `Milestone "${milestone.name || "Unnamed"}" is outside the generated period range.`,
    }));

  if (inRangePricedMilestones.length === 0) {
    return {
      amounts: sCurve(contractValue, periodRanges.length),
      warnings: dedupeWarnings([
        ...ignoredWarnings,
        ...outOfRangeWarnings,
        {
          code: "milestone_fallback",
          message:
            "No valid priced milestones were found, so milestone_weighted used s_curve instead.",
        },
      ]),
    };
  }

  const totalMilestoneValue = inRangePricedMilestones.reduce(
    (sum, milestone) => sum + (milestone.value || 0),
    0,
  );
  if (totalMilestoneValue > contractValue) {
    throw new Error("milestone_overweight");
  }

  const residual = contractValue - totalMilestoneValue;
  const basePeriodShare = residual / periodRanges.length;
  const amounts = periodRanges.map((range) => {
    const milestoneShare = inRangePricedMilestones
      .filter((milestone) => {
        const dueDate = milestone.dueDate;
        return dueDate >= range.start && dueDate <= range.end;
      })
      .reduce((sum, milestone) => sum + (milestone.value || 0), 0);
    return milestoneShare + basePeriodShare;
  });

  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  amounts[amounts.length - 1] += contractValue - total;

  return {
    amounts,
    warnings: dedupeWarnings([...ignoredWarnings, ...outOfRangeWarnings]),
  };
};

const assemblePeriods = (amounts, ranges, reportingPeriod, contractValue) => {
  const roundedAmounts = amounts.map(roundMoney);
  const roundedTotal = roundedAmounts.reduce((sum, amount) => sum + amount, 0);
  roundedAmounts[roundedAmounts.length - 1] = roundMoney(
    roundedAmounts[roundedAmounts.length - 1] + (contractValue - roundedTotal),
  );

  let running = 0;
  return roundedAmounts.map((amount, index) => {
    running += amount;
    return {
      periodLabel: formatPeriodLabel(
        index,
        ranges[index].start,
        reportingPeriod,
      ),
      periodStart: ranges[index].start,
      periodEnd: ranges[index].end,
      plannedAmount: amount,
      cumulativePlanned: roundMoney(running),
      sortOrder: index,
    };
  });
};

export const validateBalance = (amounts, contractValue) => {
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
};

export const generatePlan = (contract, strategy, params = {}) => {
  const normalized = normalizeContract(contract);
  const periodCount = computeNumPeriods(
    normalized.startDate,
    normalized.endDate,
    normalized.reportingPeriod,
  );
  const ranges = generateDateRanges(
    normalized.startDate,
    periodCount,
    normalized.reportingPeriod,
  );

  let amounts;
  let warnings = [];
  const strategyParams = {};

  if (strategy === "straight_line") {
    amounts = straightLine(normalized.contractValue, periodCount);
  } else if (strategy === "s_curve") {
    strategyParams.kSteepness = Math.max(
      3,
      Math.min(10, params.kSteepness || 6),
    );
    amounts = sCurve(
      normalized.contractValue,
      periodCount,
      strategyParams.kSteepness,
    );
  } else if (strategy === "milestone_weighted") {
    const result = milestoneWeighted(
      normalized.contractValue,
      ranges,
      normalized.milestones,
    );
    amounts = result.amounts;
    warnings = result.warnings;
  } else {
    throw new Error("invalid_strategy");
  }

  const periods = assemblePeriods(
    amounts,
    ranges,
    normalized.reportingPeriod,
    normalized.contractValue,
  );
  const validation = validateBalance(
    periods.map((period) => period.plannedAmount),
    normalized.contractValue,
  );
  if (!validation.isValid) {
    throw new Error("balance_violation");
  }

  return {
    strategy,
    strategyParams,
    totalAmount: normalized.contractValue,
    periods,
    warnings,
  };
};

export const computeKPIs = (periods, contract) => {
  const normalized = normalizeContract(contract);
  const peakCash = Math.max(
    ...periods.map((period) => period.cumulativePlanned),
  );
  const durationDays =
    (normalized.endDate.getTime() - normalized.startDate.getTime()) /
    MS_PER_DAY;
  const durationMonths = durationDays / 30.44;
  return {
    peakCash: roundMoney(peakCash),
    burnRate: roundMoney(normalized.contractValue / durationMonths),
  };
};

export const serializePeriod = (period) => ({
  id: period._id,
  periodLabel: period.periodLabel,
  periodStart: period.periodStart,
  periodEnd: period.periodEnd,
  plannedAmount: roundMoney(decimalToNumber(period.plannedAmount)),
  cumulativePlanned: roundMoney(decimalToNumber(period.cumulativePlanned)),
  sortOrder: period.sortOrder,
});

export const generatePaymentSchedule = (contract, plan, periods) => {
  const contractValue = contract.contract_value || 0;
  return {
    contractId: contract._id,
    planId: plan._id,
    strategy: plan.strategy,
    generatedAt: plan.generatedAt,
    totalAmount: roundMoney(contractValue),
    currency: contract.currency || "EGP",
    paymentCount: periods.length,
    payments: periods.map((period, index) => {
      const amount = decimalToNumber(period.plannedAmount);
      return {
        paymentNumber: index + 1,
        periodLabel: period.periodLabel,
        periodStart: period.periodStart,
        dueDate: period.periodEnd,
        amount: roundMoney(amount),
        cumulativePayment: roundMoney(
          decimalToNumber(period.cumulativePlanned),
        ),
        pctOfTotal: contractValue ? amount / contractValue : 0,
        description: `Payment ${index + 1}: planned for ${period.periodLabel}`,
      };
    }),
  };
};
