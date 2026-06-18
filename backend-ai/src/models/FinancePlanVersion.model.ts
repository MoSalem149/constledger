import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFinancePlanVersionDocument extends Document {
  planId: Types.ObjectId;
  contractId: Types.ObjectId;
  versionNumber: number;
  snapshot: Record<string, unknown>;
  replacedAt: Date;
  replacedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const financePlanVersionSchema = new Schema<IFinancePlanVersionDocument>(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'FinancePlan', required: true, index: true },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    versionNumber: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    replacedAt: { type: Date, required: true, default: Date.now },
    replacedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    collection: 'finance_plan_versions',
  },
);

financePlanVersionSchema.index({ planId: 1, versionNumber: -1 });

export const FinancePlanVersionModel = mongoose.model<IFinancePlanVersionDocument>(
  'FinancePlanVersion',
  financePlanVersionSchema,
);
