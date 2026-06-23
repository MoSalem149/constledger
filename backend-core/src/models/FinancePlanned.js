import mongoose from 'mongoose';

// FinancePlanned — one row per period within a FinancePlan. plannedAmount is
// the amount for THIS period; cumulativePlanned is the running total up to
// and including this period. sortOrder is the canonical ordering.
const financePlannedSchema = new mongoose.Schema(
  {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinancePlan', required: true, index: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    periodLabel: { type: String, required: true, trim: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    plannedAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
    cumulativePlanned: { type: mongoose.Schema.Types.Decimal128, required: true },
    sortOrder: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: 'finance_planned',
  },
);

// Compound indexes — speed up the two query patterns used by the API:
// list periods of a plan in order, and look up periods by contract + date.
financePlannedSchema.index({ planId: 1, sortOrder: 1 });
financePlannedSchema.index({ contractId: 1, periodStart: 1 });

export default mongoose.model('FinancePlanned', financePlannedSchema);
