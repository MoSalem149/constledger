import { ContractExtraction } from "../../types";

export interface ValidationResult {
  data: ContractExtraction;
  needsReview: boolean;
  validationNotes: string[];
}

// Validates extracted data against the SRS §3.3 rules (V1–V9).
// Two failure modes:
//   - HARD violation -> throw (data that should never be persisted, e.g. negative value)
//   - SOFT issue     -> push a note and continue (data is plausible but warrants human review)
export function validateExtraction(raw: ContractExtraction): ValidationResult {
  const notes: string[] = [];

  // V1 — contract_value must be non-negative if present (HARD)
  if (raw.contract_value !== null && raw.contract_value < 0) {
    throw new Error(`V1: contract_value is negative: ${raw.contract_value}`);
  }

  // V2 — dates must be valid YYYY-MM-DD if present (HARD)
  const dateFields: [string, string | null | undefined][] = [
    ["start_date", raw.start_date],
    ["end_date", raw.end_date],
  ];
  for (const [field, val] of dateFields) {
    if (val && !/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      throw new Error(`V2: ${field} is not a valid ISO 8601 date: ${val}`);
    }
  }

  // V3a — payment_terms percentages must be 0..100 (soft)
  for (const term of raw.payment_terms ?? []) {
    if (
      term.percentage !== null &&
      (term.percentage < 0 || term.percentage > 100)
    ) {
      notes.push(
        `V3a: payment term "${term.name}" has invalid percentage: ${term.percentage}`,
      );
    }
  }

  const progress = raw.paymentProgress;
  if (progress) {
    if (progress.frequency !== null && progress.frequency < 1) {
      notes.push(
        `V3a: paymentProgress has invalid frequency: ${progress.frequency}`,
      );
    }
    if (progress.dueTo !== null && progress.dueTo < 1) {
      notes.push(`V3a: paymentProgress has invalid dueTo: ${progress.dueTo}`);
    }
  }

  // V3 — payment_schedule dates valid + amounts non-negative (soft)
  for (const item of raw.payment_schedule ?? []) {
    if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      notes.push(`V3: payment_schedule has invalid date: ${item.date}`);
    }
    if (item.amount < 0) {
      notes.push(`V3: payment_schedule has negative amount: ${item.amount}`);
    }
  }

  // V4 — milestone due_dates valid (soft)
  for (const m of raw.milestones ?? []) {
    if (m.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(m.due_date)) {
      notes.push(
        `V4: milestone "${m.name}" has invalid due_date: ${m.due_date}`,
      );
    }
  }

  // V5 — reporting_period enum check (HARD)
  if (
    raw.reporting_period !== null &&
    raw.reporting_period !== "weekly" &&
    raw.reporting_period !== "biweekly" &&
    raw.reporting_period !== "monthly"
  ) {
    throw new Error(
      `V5: reporting_period has invalid value: ${raw.reporting_period}`,
    );
  }

  // V6 — duration_days consistency. Tolerance of ±2 days absorbs DST and
  // inclusive/exclusive end-date interpretations.
  if (raw.start_date && raw.end_date) {
    const start = new Date(raw.start_date).getTime();
    const end = new Date(raw.end_date).getTime();
    if (end < start) {
      notes.push("V6: end_date is before start_date.");
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

  // V7 — BOQ cross-check: every row's unit_price × quantity must equal
  // total_cost, AND the sum of row totals must equal contract_value.
  if (raw.contract_value && raw.unit_prices.length > 0) {
    raw.unit_prices.forEach((item, index) => {
      const calculated = item.unit_price * item.quantity;
      const tolerance = Math.max(1, Math.abs(item.total_cost) * 0.005);
      if (Math.abs(calculated - item.total_cost) > tolerance) {
        notes.push(
          `V7: BOQ row ${index + 1} "${item.item}" is inconsistent: ` +
            `${item.unit_price} × ${item.quantity} != ${item.total_cost}.`,
        );
      }
    });

    const boqTotal = raw.unit_prices.reduce(
      (sum, item) => sum + item.total_cost,
      0,
    );
    if (Math.abs(boqTotal - raw.contract_value) > raw.contract_value * 0.01) {
      notes.push(
        `V7: BOQ total (${boqTotal}) differs from contract_value ` +
          `(${raw.contract_value}) by more than 1%; rows may be missing or shifted.`,
      );
    }
  }

  // V8 — payment_schedule total can exceed contract_value by up to 10%
  // (retention releases push it slightly over) but not more.
  if (raw.contract_value && raw.payment_schedule.length > 0) {
    const scheduleTotal = raw.payment_schedule.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    if (scheduleTotal > raw.contract_value * 1.1) {
      notes.push(
        `V8: Sum of payment_schedule (${scheduleTotal}) exceeds contract_value (${raw.contract_value}) by more than 10%.`,
      );
    }
  }

  // V9 — parties sanity check (soft)
  const roles = raw.parties.map((p) => p.role);
  if (raw.parties.length > 0) {
    if (!roles.includes("contractor") && !roles.includes("main_contractor")) {
      notes.push("V9: No main contractor party was found.");
    }
    if (!roles.includes("subcontractor")) {
      notes.push('V9: No party with role "subcontractor" found.');
    }
  }

  // needsReview gates whether a human must review the contract before it's
  // considered "active" — see runContractAnalysis.ts.
  const missingCritical =
    raw.parties.length === 0 ||
    raw.contract_value === null ||
    raw.start_date === null ||
    raw.end_date === null;

  if (notes.length > 0) {
    console.warn("[validate] Extraction notes:", notes);
  }

  return { data: raw, needsReview: missingCritical, validationNotes: notes };
}
