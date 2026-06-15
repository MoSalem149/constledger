import mongoose, { Document, Schema, Types } from 'mongoose';

const periodSchema = new Schema(
  {
    periodLabel: String,
    startDate: Date,
    endDate: Date,
    plannedAmount: { type: Number, default: 0 },
    cumulativePlanned: { type: Number, default: 0 },
    actualAmount: { type: Number, default: 0 },
    cumulativeActual: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
  },
  { _id: false },
);

export interface IPlannedBudgetDocument extends Document {
  contract: Types.ObjectId;
  periods: {
    periodLabel?: string;
    startDate?: Date;
    endDate?: Date;
    plannedAmount: number;
    cumulativePlanned: number;
    actualAmount: number;
    cumulativeActual: number;
    variance: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const plannedBudgetSchema = new Schema<IPlannedBudgetDocument>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true },
    periods: [periodSchema],
  },
  { timestamps: true },
);

export const PlannedBudgetModel = mongoose.model<IPlannedBudgetDocument>(
  'PlannedBudget',
  plannedBudgetSchema,
);
