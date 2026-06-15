import mongoose, { Document, Schema, Types } from 'mongoose';

const workItemSchema = new Schema(
  {
    item: String,
    unit: String,
    quantity: Number,
    unitPrice: Number,
    totalCost: Number,
  },
  { _id: false },
);

export interface IActualReportDocument extends Document {
  contract: Types.ObjectId;
  periodLabel?: string;
  periodStart?: Date;
  periodEnd?: Date;
  workItems: {
    item?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    totalCost?: number;
  }[];
  totalActualCost?: number;
  submittedBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const actualReportSchema = new Schema<IActualReportDocument>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
    periodLabel: String,
    periodStart: Date,
    periodEnd: Date,
    workItems: [workItemSchema],
    totalActualCost: Number,
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    notes: String,
  },
  { timestamps: true },
);

export const ActualReportModel = mongoose.model<IActualReportDocument>(
  'ActualReport',
  actualReportSchema,
);
