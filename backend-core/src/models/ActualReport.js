const mongoose = require('mongoose');

const workItemSchema = new mongoose.Schema({
  item: String,
  unit: String,
  quantity: Number,
  unitPrice: Number,
  totalCost: Number,
});

const actualReportSchema = new mongoose.Schema({
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true },
  periodLabel: String,
  periodStart: Date,
  periodEnd: Date,
  workItems: [workItemSchema],
  totalActualCost: Number,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: String,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('ActualReport', actualReportSchema);
