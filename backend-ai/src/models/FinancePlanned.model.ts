import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFinancePlannedDocument extends Document {
  planId: Types.ObjectId;
  contractId: Types.ObjectId;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  plannedAmount: Types.Decimal128;
  cumulativePlanned: Types.Decimal128;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const financePlannedSchema = new Schema<IFinancePlannedDocument>(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'FinancePlan', required: true, index: true },
    contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    periodLabel: { type: String, required: true, trim: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    plannedAmount: { type: Schema.Types.Decimal128, required: true },
    cumulativePlanned: { type: Schema.Types.Decimal128, required: true },
    sortOrder: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: 'finance_planned',
  },
);

financePlannedSchema.index({ planId: 1, sortOrder: 1 });
financePlannedSchema.index({ contractId: 1, periodStart: 1 });

export const FinancePlannedModel = mongoose.model<IFinancePlannedDocument>(
  'FinancePlanned',
  financePlannedSchema,
);
