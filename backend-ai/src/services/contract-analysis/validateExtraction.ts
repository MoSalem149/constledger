import { ContractExtraction } from '../../types';

export interface ValidationResult {
  data: ContractExtraction;
  /** true when mandatory fields are missing — caller should set status = needs_review */
  needsReview: boolean;
  /** Human-readable notes about data quality issues found */
  validationNotes: string[];
}

/**
 * Validates the extracted data against the SRS §3.3 rules.
 * Throws on hard violations; sets needsReview for soft issues.
 */
export function validateExtraction(raw: ContractExtraction): ValidationResult {
  const notes: string[] = [];

  // V1 — contract_value must be non-negative if present
  if (raw.contract_value !== null && raw.contract_value < 0) {
    throw new Error(`V1: contract_value is negative: ${raw.contract_value}`);
  }

  // V2 — dates must be valid ISO 8601 YYYY-MM-DD if present
  const dateFields: [string, string | null | undefined][] = [
    ['start_date', raw.start_date],
    ['end_date', raw.end_date],
  ];
  for (const [field, val] of dateFields) {
    if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      throw new Error(`V2: ${field} is not a valid ISO 8601 date: ${val}`);
    }
  }

  // V3a — payment_terms percentages must be 0–100 when present
  for (const term of raw.payment_terms ?? []) {
    if (term.percentage !== null && (term.percentage < 0 || term.percentage > 100)) {
      notes.push(
        `V3a: payment term "${term.name}" has invalid percentage: ${term.percentage}`,
      );
    }

  }

  const progress = raw.paymentProgress;
  if (progress) {
    if (progress.frequency !== null && progress.frequency < 1) {
      notes.push(`V3a: paymentProgress has invalid frequency: ${progress.frequency}`);
    }
    if (progress.dueTo !== null && progress.dueTo < 1) {
      notes.push(`V3a: paymentProgress has invalid dueTo: ${progress.dueTo}`);
    }
  }

  // V3 — payment_schedule dates must be valid if present
  for (const item of raw.payment_schedule ?? []) {
    if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      notes.push(`V3: payment_schedule has invalid date: ${item.date}`);
    }
    if (item.amount < 0) {
      notes.push(`V3: payment_schedule has negative amount: ${item.amount}`);
    }
  }

  // V4 — milestone due_dates must be valid if present
  for (const m of raw.milestones ?? []) {
    if (m.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(m.due_date)) {
      notes.push(`V4: milestone "${m.name}" has invalid due_date: ${m.due_date}`);
    }
  }

  // V5 — reporting_period must be weekly | biweekly | monthly | null
  if (
    raw.reporting_period !== null &&
    raw.reporting_period !== 'weekly' &&
    raw.reporting_period !== 'biweekly' &&
    raw.reporting_period !== 'monthly'
  ) {
    throw new Error(`V5: reporting_period has invalid value: ${raw.reporting_period}`);
  }

  // V6 — duration_days consistency: if start and end are known, compute expected
  if (raw.start_date && raw.end_date) {
    const start = new Date(raw.start_date).getTime();
    const end   = new Date(raw.end_date).getTime();
    if (end < start) {
      notes.push('V6: end_date is before start_date.');
    } else if (raw.duration_days !== null) {
      const expectedDays = Math.round((end - start) / 86_400_000);
      const diff = Math.abs(expectedDays - raw.duration_days);
      if (diff > 2) {
        notes.push(
          `V6: duration_days (${raw.duration_days}) does not match start→end gap (${expectedDays} days).`,
        );
      }
    }
  }

  // V7 — BOQ cross-check: sum of (quantity × unit_price) should approximate contract_value
  // Only check if we have unit_prices AND contract_value AND the contract is unit-rate based
  if (raw.contract_value && raw.unit_prices.length > 0) {
    // This is a rough plausibility check — we don't always have quantities here
    // so we just verify no unit_price is larger than the entire contract (obvious error)
    const maxUnitPrice = Math.max(...raw.unit_prices.map((u) => u.unit_price));
    if (maxUnitPrice > raw.contract_value) {
      notes.push(
        `V7: A unit_price (${maxUnitPrice}) exceeds the total contract_value (${raw.contract_value}) — likely a total was captured instead of a unit price.`,
      );
    }
  }

  // V8 — payment_schedule total should not exceed contract_value
  if (raw.contract_value && raw.payment_schedule.length > 0) {
    const scheduleTotal = raw.payment_schedule.reduce((sum, p) => sum + p.amount, 0);
    // Allow up to 110% (retention releases can push it slightly over)
    if (scheduleTotal > raw.contract_value * 1.1) {
      notes.push(
        `V8: Sum of payment_schedule (${scheduleTotal}) exceeds contract_value (${raw.contract_value}) by more than 10%.`,
      );
    }
  }

  // V9 — parties: warn if no contractor or no subcontractor role found
  const roles = raw.parties.map((p) => p.role);
  if (raw.parties.length > 0) {
    if (!roles.includes('contractor')) {
      notes.push('V9: No party with role "contractor" found.');
    }
    if (!roles.includes('subcontractor')) {
      notes.push('V9: No party with role "subcontractor" found.');
    }
  }

  // Determine whether human review is recommended
  const missingCritical =
    raw.parties.length === 0 ||
    raw.contract_value === null ||
    raw.start_date === null ||
    raw.end_date === null;

  if (notes.length > 0) {
    console.warn('[validate] Extraction notes:', notes);
  }

  return { data: raw, needsReview: missingCritical, validationNotes: notes };
}
