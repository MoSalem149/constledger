import mongoose, { Document, Schema } from "mongoose";

// ContractExtraction — append-friendly mirror of the AI-extracted fields,
// upserted by contractId on every analysis run (see saveExtraction.ts). Its
// schema is the strictly-validated source of truth for what the AI produced;
// the Contract collection holds the loosely-typed editable copy that users
// see. All extracted string values are stored in English.

export interface IParty {
  name: string;
  role: string;
}

export interface IUnitPrice {
  item: string;
  unit: string;
  unit_price: number;
  quantity: number;
  total_cost: number;
}

export interface IPaymentScheduleEntry {
  date: string | null;
  amount: number;
}

export interface IMilestone {
  name: string;
  due_date: string | null;
  value?: number | null;
}

export interface IPenalty {
  condition: string;
  penalty: string | null;
  first_offense: string | null;
  second_offense: string | null;
  third_offense: string | null;
}

export interface IPaymentProgress {
  basis: string | null;
  frequency: number | null;
  dueTo: number | null;
}

export interface IPaymentTerm {
  name: string;
  percentage: number | null;
  description: string | null;
}

export interface IContractExtractionDocument extends Document {
  contractId: string;

  parties: IParty[];
  contract_value: number | null;
  currency: string | null;
  unit_prices: IUnitPrice[];
  paymentProgress: IPaymentProgress | null;
  payment_terms: IPaymentTerm[];
  payment_schedule: IPaymentScheduleEntry[];
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  reporting_period: "weekly" | "biweekly" | "monthly" | null;
  milestones: IMilestone[];
  penalties: IPenalty[];

  isScanned: boolean;
  validationNotes: string[];
  status: "active" | "needs_review" | "approved" | "analysis_failed";

  createdAt: Date;
  updatedAt: Date;
}

const PartySchema = new Schema<IParty>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const UnitPriceSchema = new Schema<IUnitPrice>(
  {
    item: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    unit_price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    total_cost: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const PaymentScheduleEntrySchema = new Schema<IPaymentScheduleEntry>(
  {
    date: { type: String, default: null },
    amount: { type: Number, required: true },
  },
  { _id: false },
);

const MilestoneSchema = new Schema<IMilestone>(
  {
    name: { type: String, required: true, trim: true },
    due_date: { type: String, default: null },
    value: { type: Number, default: null, min: 0 },
  },
  { _id: false },
);

const PenaltySchema = new Schema<IPenalty>(
  {
    condition: { type: String, required: true, trim: true },
    penalty: { type: String, default: null, trim: true },
    first_offense: { type: String, default: null, trim: true },
    second_offense: { type: String, default: null, trim: true },
    third_offense: { type: String, default: null, trim: true },
  },
  { _id: false },
);

const PaymentProgressSchema = new Schema<IPaymentProgress>(
  {
    basis: { type: String, default: null, trim: true },
    frequency: { type: Number, default: null, min: 1 },
    dueTo: { type: Number, default: null, min: 1 },
  },
  { _id: false },
);

const PaymentTermSchema = new Schema<IPaymentTerm>(
  {
    name: { type: String, required: true, trim: true },
    percentage: { type: Number, default: null, min: 0, max: 100 },
    description: { type: String, default: null, trim: true },
  },
  { _id: false },
);

const ContractExtractionSchema = new Schema<IContractExtractionDocument>(
  {
    contractId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    parties: { type: [PartySchema], default: [] },
    contract_value: { type: Number, default: null },
    currency: { type: String, default: null, trim: true },
    unit_prices: { type: [UnitPriceSchema], default: [] },
    paymentProgress: { type: PaymentProgressSchema, default: null },
    payment_terms: { type: [PaymentTermSchema], default: [] },
    payment_schedule: { type: [PaymentScheduleEntrySchema], default: [] },
    start_date: { type: String, default: null },
    end_date: { type: String, default: null },
    duration_days: { type: Number, default: null },
    reporting_period: {
      type: String,
      enum: ["weekly", "biweekly", "monthly", null],
      default: null,
    },
    milestones: { type: [MilestoneSchema], default: [] },
    penalties: { type: [PenaltySchema], default: [] },

    isScanned: { type: Boolean, default: false },
    validationNotes: { type: [String], default: [] },
    // Independent of Contract.status — see Contract.model.ts header.
    status: {
      type: String,
      enum: ["active", "needs_review", "approved", "analysis_failed"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "contract_extractions",
  },
);

// Supports "give me the latest extraction for this contract" lookups.
ContractExtractionSchema.index({ contractId: 1, createdAt: -1 });

export const ContractExtractionModel =
  mongoose.model<IContractExtractionDocument>(
    "ContractExtraction",
    ContractExtractionSchema,
  );
