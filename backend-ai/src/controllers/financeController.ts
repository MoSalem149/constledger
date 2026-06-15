import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { PlannedBudgetModel } from '../models/PlannedBudget.model';
import { ActualReportModel } from '../models/ActualReport.model';

export const getPlannedBudget = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const budget = await PlannedBudgetModel.findOne({ contract: req.params.contractId });
    if (!budget) {
      res.status(404).json({ message: 'Budget not found' });
      return;
    }
    res.json({ budget });
  } catch (err) {
    next(err);
  }
};

export const updatePlannedBudget = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const budget = await PlannedBudgetModel.findOneAndUpdate(
      { contract: req.params.contractId },
      req.body,
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ budget });
  } catch (err) {
    next(err);
  }
};

export const listActualReports = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: Record<string, unknown> = { contract: req.params.contractId };
    if (status) filter.status = status;

    const reports = await ActualReportModel.find(filter)
      .populate('submittedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
};

export const submitActualReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await ActualReportModel.create({
      ...req.body,
      contract: req.params.contractId,
      submittedBy: req.user!.id,
    });
    res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
};

export const editActualReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await ActualReportModel.findOneAndUpdate(
      { _id: req.params.id, contract: req.params.contractId, status: 'pending' },
      req.body,
      { new: true, runValidators: true },
    );
    if (!report) {
      res.status(404).json({ message: 'Report not found or not editable' });
      return;
    }
    res.json({ report });
  } catch (err) {
    next(err);
  }
};

export const approveReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await ActualReportModel.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user!.id },
      { new: true },
    );
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    res.json({ report });
  } catch (err) {
    next(err);
  }
};

export const rejectReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await ActualReportModel.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: req.body.reason },
      { new: true },
    );
    if (!report) {
      res.status(404).json({ message: 'Report not found' });
      return;
    }
    res.json({ report });
  } catch (err) {
    next(err);
  }
};

export const getComparison = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { contractId } = req.params;
    const planned = await PlannedBudgetModel.findOne({ contract: contractId });
    const actuals = await ActualReportModel.find({ contract: contractId, status: 'approved' }).sort({
      createdAt: 1,
    });
    res.json({ planned, actuals });
  } catch (err) {
    next(err);
  }
};
