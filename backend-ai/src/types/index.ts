// ── Shared types for the AI service ──────────────────────────────────

export type ReportingPeriod = 'weekly' | 'monthly';

export interface PaymentProgress {
  basis: string | null;
  frequency: number | null;
  dueTo: number | null;
}

export interface PaymentTerm {
  name: string;
  percentage: number | null;
  description: string | null;
}

/** SRS §3.3 — exact fields, no more, no less */
export interface ContractExtraction {
  /** All contract parties with their role */
  parties: { name: string; role: string }[];

  /** Total contract price */
  contract_value: number | null;

  /** ISO-4217 currency code e.g. USD, EGP */
  currency: string | null;

  /** Price per unit for each work item */
  unit_prices: { item: string; unit: string; unit_price: number }[];

  /** Progress payment card — one per contract */
  paymentProgress: PaymentProgress | null;

  /** Structured payment milestones (advance, progress, retention, etc.) */
  payment_terms: PaymentTerm[];

  /** Specific payment dates and amounts */
  payment_schedule: { date: string; amount: number }[];

  /** Official project start date (YYYY-MM-DD) */
  start_date: string | null;

  /** Official project end date (YYYY-MM-DD) */
  end_date: string | null;

  /** Total duration in days */
  duration_days: number | null;

  /** Is progress reported weekly or monthly? */
  reporting_period: ReportingPeriod | null;

  /** Key deliverables and their deadlines */
  milestones: { name: string; due_date: string }[];

  /** Delay penalties: condition and amount/formula */
  penalties: { condition: string; penalty: string }[];
}

export interface FinanceForecast {
  periods: {
    label: string;
    plannedAmount: number;
    startDate: string;
    endDate: string;
  }[];
}
