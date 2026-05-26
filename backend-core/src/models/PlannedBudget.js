const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodLabel: String,      // e.g. "Week 1" / "January 2026"
  startDate: Date,
  endDate: Date,
  plannedAmount: { type: Number, default: 0 },
  cumulativePlanned: { type: Number, default: 0 },
  actualAmount: { type: Number, default: 0 },
  cumulativeActual: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
});

const plannedBudgetSchema = new mongoose.Schema({
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true },
  periods: [periodSchema],
}, { timestamps: true });

module.exports = mongoose.model('PlannedBudget', plannedBudgetSchema);
