import mongoose from "mongoose";

// Sub-schemas — _id: false because they are pure value objects nested in Contract.
const partySchema = new mongoose.Schema(
  { name: String, role: String },
  { _id: false },
);
const unitPriceSchema = new mongoose.Schema(
  { item: String, unit: String, unit_price: Number },
  { _id: false },
);
const paymentProgressSchema = new mongoose.Schema(
  { basis: String, frequency: Number, dueTo: Number },
  { _id: false },
);
const paymentTermsSchema = new mongoose.Schema(
  { name: String, percentage: Number, description: String },
  { _id: false },
);
const milestoneSchema = new mongoose.Schema(
  { name: String, due_date: String, value: { type: Number, min: 0 } },
  { _id: false },
);
const penaltySchema = new mongoose.Schema(
  {
    condition: String,
    penalty: { type: String, default: null },
    first_offense: { type: String, default: null },
    second_offense: { type: String, default: null },
    third_offense: { type: String, default: null },
  },
  { _id: false },
);
const paymentScheduleSchema = new mongoose.Schema(
  { date: String, amount: Number },
  { _id: false },
);

// Contract — the main domain document. Populated by backend-ai after upload
// (status flows: processing -> pending_review -> active) and consumed by the
// finance planning module to drive plan generation.
const contractSchema = new mongoose.Schema(
  {
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
    // Lifecycle: processing -> analysis_failed | pending_review -> active.
    // Plans can only be generated once status === "active".
    status: {
      type: String,
      enum: ["processing", "analysis_failed", "pending_review", "active"],
      default: "processing",
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    contractDocId: { type: mongoose.Schema.Types.ObjectId, ref: "UploadJob" },
  },
  { timestamps: true },
);

export default mongoose.model("Contract", contractSchema);
