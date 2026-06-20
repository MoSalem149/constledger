// NOTE: CommonJS file in an ESM project — this model is referenced only by the
// unused financeController.js (also CommonJS). See README/notes.

const mongoose = require('mongoose');

// Period row inside a planned budget: planned vs actual with running totals
// and variance. Designed for in-place updates rather than separate documents.
const periodSchema = new mongoose.Schema({
  periodLabel: String,
  startDate: Date,
  endDate: Date,
  plannedAmount: { type: Number, default: 0 },
  cumulativePlanned: { type: Number, default: 0 },
  actualAmount: { type: Number, default: 0 },
  cumulativeActual: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
});

// PlannedBudget — one document per contract (unique). Holds the full period
// breakdown as an embedded array.
const plannedBudgetSchema = new mongoose.Schema({
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true },
  periods: [periodSchema],
}, { timestamps: true });

module.exports = mongoose.model('PlannedBudget', plannedBudgetSchema);
