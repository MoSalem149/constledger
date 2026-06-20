import mongoose from 'mongoose';

// Each plan can carry warnings raised by planningService (e.g. milestone
// out-of-range, fallback used). They are surfaced to the UI.
const warningSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { _id: false },
);

// FinancePlan — the header for a contract's payment plan. One per contract
// (enforced by the unique index on contractId). Period rows live in the
// FinancePlanned collection. Status: draft -> confirmed; reports only run
// against confirmed plans.
const financePlanSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
      unique: true,
      index: true,
    },
    strategy: {
      type: String,
      enum: ['straight_line', 's_curve', 'milestone_weighted'],
      required: true,
    },
    strategyParams: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Decimal128 — money values use a base-10 fixed-point type to avoid
    // float drift across roll-ups and exports.
    totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'confirmed'], default: 'draft' },
    warnings: { type: [warningSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'finance_plan',
  },
);

export default mongoose.model('FinancePlan', financePlanSchema);
