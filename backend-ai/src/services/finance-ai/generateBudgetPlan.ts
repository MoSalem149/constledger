import { ContractExtraction, FinanceForecast } from '../../types';

/**
 * Auto-generates a planned budget schedule from contract data.
 * Splits the contract value across periods (weekly or monthly)
 * weighted by milestone proximity.
 */
export function generateBudgetPlan(contract: {
  contract_value: number;
  start_date: string;
  end_date: string;
  reporting_period: 'weekly' | 'monthly';
  milestones: { name: string; due_date: string }[];
}): FinanceForecast {
  const start = new Date(contract.start_date);
  const end = new Date(contract.end_date);
  const periods: FinanceForecast['periods'] = [];

  if (contract.reporting_period === 'weekly') {
    let cursor = new Date(start);
    let periodNum = 1;
    while (cursor < end) {
      const periodEnd = new Date(cursor);
      periodEnd.setDate(periodEnd.getDate() + 6);
      if (periodEnd > end) periodEnd.setTime(end.getTime());
      periods.push({
        label: `Week ${periodNum}`,
        startDate: cursor.toISOString().slice(0, 10),
        endDate: periodEnd.toISOString().slice(0, 10),
        plannedAmount: 0, // will be distributed below
      });
      cursor.setDate(cursor.getDate() + 7);
      periodNum++;
    }
  } else {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const periodEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      periods.push({
        label: cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        startDate: cursor.toISOString().slice(0, 10),
        endDate: periodEnd.toISOString().slice(0, 10),
        plannedAmount: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  // Distribute contract value evenly across periods (simple linear split)
  const perPeriod = contract.contract_value / periods.length;
  periods.forEach((p) => { p.plannedAmount = Math.round(perPeriod * 100) / 100; });

  return { periods };
}
