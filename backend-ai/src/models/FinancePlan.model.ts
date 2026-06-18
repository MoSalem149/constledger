import mongoose, { Document, Schema, Types } from 'mongoose';

export type FinancePlanStrategy = 'straight_line' | 's_curve' | 'milestone_weighted';
export type FinancePlanStatus = 'draft' | 'confirmed';

export interface IPlanWarning {
  code: string;
  message: string;
}

export interface IFinancePlanDocument extends Document {
  contractId: Types.ObjectId;
  strategy: FinancePlanStrategy;
  strategyParams: Record<string, unknown>;
  totalAmount: Types.Decimal128;
  generatedAt: Date;
  generatedBy: Types.ObjectId;
  status: FinancePlanStatus;
  warnings: IPlanWarning[];
  createdAt: Date;
  updatedAt: Date;
}

const warningSchema = new Schema<IPlanWarning>(
  {
    code: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const financePlanSchema = new Schema<IFinancePlanDocument>(
  {
    contractId: {
      type: Schema.Types.ObjectId,
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
    strategyParams: { type: Schema.Types.Mixed, default: {} },
    totalAmount: { type: Schema.Types.Decimal128, required: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'confirmed'], default: 'draft' },
    warnings: { type: [warningSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'finance_plan',
  },
);

export const FinancePlanModel = mongoose.model<IFinancePlanDocument>(
  'FinancePlan',
  financePlanSchema,
);
