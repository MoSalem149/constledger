export type ReportingPeriod = "weekly" | "biweekly" | "monthly";

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

export interface Penalty {
  condition: string;
  penalty: string | null;
  first_offense: string | null;
  second_offense: string | null;
  third_offense: string | null;
}

// CANONICAL shape of AI-extracted contract data (SRS §3.3). This MUST stay in
// sync with assets/OrderSchema.md (the LLM prompt schema) and the Contract /
// ContractExtraction Mongoose schemas — all three describe the same fields
// and should be updated together.
export interface ContractExtraction {
  parties: { name: string; role: string }[];
  contract_value: number | null;

  /** ISO-4217 currency code e.g. USD, EGP */
  currency: string | null;
  unit_prices: {
    item: string;
    unit: string;
    unit_price: number;
    quantity: number;
    total_cost: number;
  }[];
  paymentProgress: PaymentProgress | null;
  payment_terms: PaymentTerm[];
  payment_schedule: { date: string; amount: number }[];
  start_date: string | null;

  /** Official project end date (YYYY-MM-DD) */
  end_date: string | null;

  /** Total duration in days */
  duration_days: number | null;
  reporting_period: ReportingPeriod | null;
  milestones: { name: string; due_date: string; value?: number | null }[];
  // Delay penalties and HSE offense tiers, grouped by condition.
  penalties: Penalty[];
}
