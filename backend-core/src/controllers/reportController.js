const Contract = require('../models/Contract');
const PlannedBudget = require('../models/PlannedBudget');
const ActualReport = require('../models/ActualReport');

exports.allContractsReport = async (req, res, next) => {
  try {
    const { year, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (year) filter.start_date = { $regex: `^${year}` };
    const contracts = await Contract.find(filter).select('name parties contract_value start_date end_date status duration_days');
    res.json({ contracts, total: contracts.length });
  } catch (err) { next(err); }
};

exports.monthlyReport = async (req, res, next) => {
  try {
    const { month, year, contractId } = req.query;
    const filter = { status: 'approved' };
    if (contractId) filter.contract = contractId;
    const reports = await ActualReport.find(filter).populate('contract', 'name contract_value');
    res.json({ reports });
  } catch (err) { next(err); }
};

exports.projectPerformanceReport = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.projectId);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    const budget = await PlannedBudget.findOne({ contract: contract._id });
    const reports = await ActualReport.find({ contract: contract._id, status: 'approved' });
    const totalActual = reports.reduce((sum, r) => sum + (r.totalActualCost || 0), 0);
    const totalPlanned = contract.contract_value || 0;
    const cpi = totalActual > 0 ? totalPlanned / totalActual : null;
    res.json({ contract, budget, totalActual, totalPlanned, cpi, reports });
  } catch (err) { next(err); }
};
