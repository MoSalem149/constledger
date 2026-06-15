import mongoose, { Document, Schema, Types } from 'mongoose';

const partySchema = new Schema({ name: String, role: String }, { _id: false });
const unitPriceSchema = new Schema({ item: String, unit: String, unit_price: Number }, { _id: false });
const paymentProgressSchema = new Schema(
  { basis: String, frequency: Number, dueTo: Number },
  { _id: false },
);
const paymentTermsSchema = new Schema(
  { name: String, percentage: Number, description: String },
  { _id: false },
);
const milestoneSchema = new Schema({ name: String, due_date: String }, { _id: false });
const penaltySchema = new Schema({ condition: String, penalty: String }, { _id: false });
const paymentScheduleSchema = new Schema({ date: String, amount: Number }, { _id: false });

export interface IContractDocument extends Document {
  contractNumber: string;
  name: string;
  parties: { name: string; role: string }[];
  contract_value?: number;
  currency?: string;
  unit_prices: { item: string; unit: string; unit_price: number }[];
  paymentProgress?: { basis?: string; frequency?: number; dueTo?: number };
  payment_terms: { name: string; percentage?: number | null; description?: string | null }[];
  payment_schedule: { date: string; amount: number }[];
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  reporting_period?: 'weekly' | 'monthly';
  milestones: { name: string; due_date: string }[];
  penalties: { condition: string; penalty: string }[];
  status: 'processing' | 'analysis_failed' | 'pending_review' | 'active';
  uploadedBy?: Types.ObjectId;
  contractDocId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<IContractDocument>(
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
    reporting_period: { type: String, enum: ['weekly', 'monthly'] },
    milestones: [milestoneSchema],
    penalties: [penaltySchema],
    status: {
      type: String,
      enum: ['processing', 'analysis_failed', 'pending_review', 'active'],
      default: 'processing',
    },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    contractDocId: { type: Schema.Types.ObjectId, ref: 'UploadJob', required: true },
  },
  { timestamps: true },
);

export const ContractModel = mongoose.model<IContractDocument>('Contract', contractSchema);
