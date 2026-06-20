// NOTE: This file is not currently mounted by app.js (the live finance endpoints
// live in planningController.js). It is also written in CommonJS while the rest
// of the project uses ESM (package.json has "type": "module"). See README/notes.

const PlannedBudget = require('../models/PlannedBudget');
const ActualReport = require('../models/ActualReport');

// GET planned budget for a contract
exports.getPlannedBudget = async (req, res, next) => {
  try {
    const budget = await PlannedBudget.findOne({ contract: req.params.contractId });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    res.json({ budget });
  } catch (err) { next(err); }
};

// PUT planned budget for a contract
exports.updatePlannedBudget = async (req, res, next) => {
  try {
    const budget = await PlannedBudget.findOneAndUpdate(
      { contract: req.params.contractId }, req.body, { new: true }
    );
    res.json({ budget });
  } catch (err) { next(err); }
};

// GET actual reports — optional filters ?contractId & ?status
exports.listActualReports = async (req, res, next) => {
  try {
    const { contractId, status } = req.query;
    const filter = {};
    if (contractId) filter.contract = contractId;
    if (status) filter.status = status;
    const reports = await ActualReport.find(filter).populate('submittedBy', 'name').sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) { next(err); }
};

// POST a new actual report
exports.submitActualReport = async (req, res, next) => {
  try {
    const report = await ActualReport.create({ ...req.body, submittedBy: req.user._id });
    res.status(201).json({ report });
  } catch (err) { next(err); }
};

// Approve a pending actual report
exports.approveReport = async (req, res, next) => {
  try {
    const report = await ActualReport.findByIdAndUpdate(
      req.params.id, { status: 'approved', approvedBy: req.user._id }, { new: true }
    );
    res.json({ report });
  } catch (err) { next(err); }
};

// Reject a pending actual report with a reason
exports.rejectReport = async (req, res, next) => {
  try {
    const report = await ActualReport.findByIdAndUpdate(
      req.params.id, { status: 'rejected', rejectionReason: req.body.reason }, { new: true }
    );
    res.json({ report });
  } catch (err) { next(err); }
};
