import mongoose from 'mongoose';

const warningSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { _id: false },
);

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
