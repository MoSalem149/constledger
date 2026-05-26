const Contract = require('../models/Contract');
const axios = require('axios');

exports.uploadContract = async (req, res, next) => {
  try {
    const { path: fileUrl, filename } = req.file;
    const contract = await Contract.create({
      name: req.body.name || filename,
      fileUrl,
      uploadedBy: req.user._id,
      status: 'processing',
    });
    // Fire-and-forget AI analysis
    axios.post(`${process.env.AI_SERVICE_URL}/api/ai/contracts/${contract._id}/analyze`, {}, {
      headers: { 'x-internal-secret': process.env.AI_SERVICE_SECRET },
    }).catch((err) => console.error('[ai] trigger failed:', err.message));
    res.status(201).json({ contract });
  } catch (err) { next(err); }
};

exports.listContracts = async (req, res, next) => {
  try {
    const { status, year, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (year) { filter.start_date = { $regex: `^${year}` }; }
    if (search) filter.name = { $regex: search, $options: 'i' };
    const contracts = await Contract.find(filter).sort({ createdAt: -1 });
    res.json({ contracts });
  } catch (err) { next(err); }
};

exports.getContract = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ contract });
  } catch (err) { next(err); }
};

exports.updateContract = async (req, res, next) => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ contract });
  } catch (err) { next(err); }
};

exports.reanalyzeContract = async (req, res, next) => {
  try {
    await Contract.findByIdAndUpdate(req.params.id, { status: 'processing' });
    axios.post(`${process.env.AI_SERVICE_URL}/api/ai/contracts/${req.params.id}/analyze`, {}, {
      headers: { 'x-internal-secret': process.env.AI_SERVICE_SECRET },
    }).catch((err) => console.error('[ai] re-trigger failed:', err.message));
    res.json({ message: 'Re-analysis started' });
  } catch (err) { next(err); }
};

exports.getTimeline = async (req, res, next) => {
  try {
    const contract = await Contract.findById(req.params.id, 'milestones start_date end_date');
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ milestones: contract.milestones, start_date: contract.start_date, end_date: contract.end_date });
  } catch (err) { next(err); }
};
