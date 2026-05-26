// ── Shared types for the AI service ──────────────────────────────────

export interface ContractParty {
  name: string;
  role: string;
}

export interface UnitPrice {
  item: string;
  unit: string;
  unit_price: number;
}

export interface Milestone {
  name: string;
  due_date: string;
}

export interface Penalty {
  condition: string;
  penalty: string;
}

export interface PaymentScheduleItem {
  date: string;
  amount: number;
}

/** The full structured JSON the LLM must return for contract analysis */
export interface ContractExtraction {
  parties: ContractParty[] | null;
  contract_value: number | null;
  currency: string | null;
  unit_prices: UnitPrice[] | null;
  payment_terms: string | null;
  payment_schedule: PaymentScheduleItem[] | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  reporting_period: 'weekly' | 'monthly' | null;
  milestones: Milestone[] | null;
  penalties: Penalty[] | null;
}

export interface FinanceForecast {
  periods: {
    label: string;
    plannedAmount: number;
    startDate: string;
    endDate: string;
  }[];
}
