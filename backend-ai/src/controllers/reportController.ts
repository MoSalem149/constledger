import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { ContractModel } from '../models/Contract.model';
import { PlannedBudgetModel } from '../models/PlannedBudget.model';
import { ActualReportModel } from '../models/ActualReport.model';

export const allContractsReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { year, status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (year) filter.start_date = { $regex: `^${year}` };

    const contracts = await ContractModel.find(filter).select(
      'name parties contract_value start_date end_date status duration_days',
    );
    res.json({ contracts, total: contracts.length });
  } catch (err) {
    next(err);
  }
};

export const monthlyReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { month, year, project } = req.query;
    const filter: Record<string, unknown> = { status: 'approved' };
    if (project) filter.contract = project;

    const reports = await ActualReportModel.find(filter)
      .populate('contract', 'name contract_value')
      .populate('submittedBy', 'name');
    res.json({ month, year, reports });
  } catch (err) {
    next(err);
  }
};

export const quarterlyReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { quarter, year, project } = req.query;
    const filter: Record<string, unknown> = { status: 'approved' };
    if (project) filter.contract = project;

    const reports = await ActualReportModel.find(filter)
      .populate('contract', 'name contract_value')
      .populate('submittedBy', 'name');
    res.json({ quarter, year, reports });
  } catch (err) {
    next(err);
  }
};

export const projectPerformanceReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const contract = await ContractModel.findById(req.params.id);
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    const budget = await PlannedBudgetModel.findOne({ contract: contract._id });
    const reports = await ActualReportModel.find({
      contract: contract._id,
      status: 'approved',
    }).sort({ createdAt: 1 });

    const totalActual = reports.reduce(
      (sum: number, r) => sum + (r.totalActualCost || 0),
      0,
    );
    const totalPlanned = contract.contract_value || 0;
    const cpi = totalActual > 0 ? totalPlanned / totalActual : null;

    res.json({ contract, budget, totalActual, totalPlanned, cpi, reports, startDate, endDate });
  } catch (err) {
    next(err);
  }
};

export const penaltiesReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { project, startDate, endDate } = req.query;
    const filter: Record<string, unknown> = {};
    if (project) filter._id = project;

    const contracts = await ContractModel.find(filter).select(
      'name penalties milestones start_date end_date',
    );
    res.json({ contracts, startDate, endDate });
  } catch (err) {
    next(err);
  }
};

export const exportReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { type, contractId, format = 'json' } = req.body;
    res.json({ message: 'Export queued', type, contractId, format });
  } catch (err) {
    next(err);
  }
};
