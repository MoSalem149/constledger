import mongoose, { Document, Schema, Types } from "mongoose";

// Sub-schemas — _id: false because they are pure value objects nested in Contract.
const partySchema = new Schema({ name: String, role: String }, { _id: false });
const unitPriceSchema = new Schema(
  {
    item: String,
    unit: String,
    unit_price: Number,
    quantity: Number,
    total_cost: Number,
  },
  { _id: false },
);
const paymentProgressSchema = new Schema(
  { basis: String, frequency: Number, dueTo: Number },
  { _id: false },
);
const paymentTermsSchema = new Schema(
  { name: String, percentage: Number, description: String },
  { _id: false },
);
const milestoneSchema = new Schema(
  { name: String, due_date: String, value: { type: Number, min: 0 } },
  { _id: false },
);
const penaltySchema = new Schema(
  {
    condition: String,
    penalty: { type: String, default: null },
    first_offense: { type: String, default: null },
    second_offense: { type: String, default: null },
    third_offense: { type: String, default: null },
  },
  { _id: false },
);
const paymentScheduleSchema = new Schema(
  { date: String, amount: Number },
  { _id: false },
);

export interface IContractDocument extends Document {
  contractNumber: string;
  name: string;
  parties: { name: string; role: string }[];
  contract_value?: number;
  currency?: string;
  unit_prices: {
    item: string;
    unit: string;
    unit_price: number;
    quantity: number;
    total_cost: number;
  }[];
  paymentProgress?: { basis?: string; frequency?: number; dueTo?: number };
  payment_terms: {
    name: string;
    percentage?: number | null;
    description?: string | null;
  }[];
  payment_schedule: { date: string; amount: number }[];
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  reporting_period?: "weekly" | "biweekly" | "monthly";
  milestones: { name: string; due_date: string; value?: number }[];
  penalties: {
    condition: string;
    penalty: string | null;
    first_offense: string | null;
    second_offense: string | null;
    third_offense: string | null;
  }[];
  status: "processing" | "analysis_failed" | "pending_review" | "active";
  uploadedBy?: Types.ObjectId;
  contractDocId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Contract — the LIVE record the API reads/writes/displays. Its `status` drives
// the upload -> analyze -> review workflow. runContractAnalysis() copies the
// validated extraction onto this document. A second, stricter, append-friendly
// copy is kept in ContractExtraction.model.ts (see that file's header for the
// difference between the two collections).
const contractSchema = new Schema<IContractDocument>(
  {
    // sparse so legacy documents created before this field existed don't
    // collide on the unique constraint — see database.ts syncContractIndexes.
    contractNumber: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    parties: [partySchema],
    contract_value: Number,
    currency: String,
    unit_prices: [unitPriceSchema],
    paymentProgress: paymentProgressSchema,
    payment_terms: [paymentTermsSchema],
    payment_schedule: [paymentScheduleSchema],
    start_date: String,
    end_date: String,
    duration_days: Number,
    reporting_period: { type: String, enum: ["weekly", "biweekly", "monthly"] },
    milestones: [milestoneSchema],
    penalties: [penaltySchema],
    // Lifecycle: processing -> (analysis_failed | pending_review) -> active.
    // Default pending_review because every new contract needs human review
    // until analysis lands on active.
    status: {
      type: String,
      enum: ["processing", "analysis_failed", "pending_review", "active"],
      default: "pending_review",
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    contractDocId: {
      type: Schema.Types.ObjectId,
      ref: "UploadJob",
      required: true,
    },
  },
  { timestamps: true },
);

export const ContractModel = mongoose.model<IContractDocument>(
  "Contract",
  contractSchema,
);
