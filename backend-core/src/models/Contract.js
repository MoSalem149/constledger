const mongoose = require('mongoose');

const partySchema = new mongoose.Schema({ name: String, role: String });
const unitPriceSchema = new mongoose.Schema({ item: String, unit: String, unit_price: Number });
const milestoneSchema = new mongoose.Schema({ name: String, due_date: String });
const penaltySchema = new mongoose.Schema({ condition: String, penalty: String });
const paymentScheduleSchema = new mongoose.Schema({ date: String, amount: Number });

const contractSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileUrl: { type: String, required: true },
  filePublicId: String,

  // AI-extracted fields
  parties: [partySchema],
  contract_value: Number,
  currency: String,
  unit_prices: [unitPriceSchema],
  payment_terms: String,
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
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
