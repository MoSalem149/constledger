import mongoose from 'mongoose';

const financePlanVersionSchema = new mongoose.Schema(
  {
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinancePlan', required: true, index: true },
    contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    versionNumber: { type: Number, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    replacedAt: { type: Date, required: true, default: Date.now },
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'finance_plan_versions',
  },
);

financePlanVersionSchema.index({ planId: 1, versionNumber: -1 });

export default mongoose.model('FinancePlanVersion', financePlanVersionSchema);
