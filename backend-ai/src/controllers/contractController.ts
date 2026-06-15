import { randomUUID } from 'crypto';
import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';

import { connectDatabase } from '../config/database';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { ContractModel } from '../models/Contract.model';
import { PlannedBudgetModel } from '../models/PlannedBudget.model';
import { UploadJobModel, IUploadJob } from '../models/UploadJob.model';
import { runContractAnalysis } from '../services/contract-analysis/runContractAnalysis';
import { generateBudgetPlan } from '../services/finance-ai/generateBudgetPlan';
import { downloadS3Object, getPresignedDownloadUrl } from '../utils/s3Storage';

const markAnalysisFailed = async (
  contractId: string,
  err: unknown,
): Promise<void> => {
  console.error(`[analyze] failed for ${contractId}:`, (err as Error).message);
  await ContractModel.findByIdAndUpdate(contractId, {
    status: 'analysis_failed',
  });
};

async function resolveUploadJob(uploadId: string, userId: string) {
  const uploadJob = await UploadJobModel.findById(uploadId);
  if (!uploadJob) return { error: 'Upload record not found' as const };
  if (uploadJob.uploadedBy.toString() !== userId) {
    return { error: 'You do not have access to this upload' as const };
  }
  return { uploadJob };
}

function getPopulatedUploadJob(
  contractDocId: Types.ObjectId | IUploadJob | undefined,
): IUploadJob | null {
  if (!contractDocId || contractDocId instanceof Types.ObjectId) return null;
  return contractDocId;
}

export const uploadContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { uploadId, name } = req.body as { uploadId?: string; name?: string };
    console.log(req.body);
    if (!uploadId) {
      res.status(400).json({ message: 'uploadId is required' });
      return;
    }

    await connectDatabase();

    const resolved = await resolveUploadJob(uploadId, req.user!.id);
    if ('error' in resolved) {
      res.status(resolved.error === 'Upload record not found' ? 404 : 403).json({
        message: resolved.error,
      });
      return;
    }

    const { uploadJob } = resolved;
    const alreadyLinked = await ContractModel.findOne({ contractDocId: uploadJob._id });
    if (alreadyLinked) {
      res.status(409).json({ message: 'This upload is already linked to a contract' });
      return;
    }

    const contract = await ContractModel.create({
      contractNumber: `CPMS-${randomUUID()}`,
      name: name || uploadJob.fileName,
      contractDocId: uploadJob._id,
      uploadedBy: req.user!.id,
      status: 'processing',
    });

    await UploadJobModel.findByIdAndUpdate(uploadJob._id, { status: 'linked' });

    const contractId = contract._id.toString();
    try {
      const fileBuffer = await downloadS3Object(uploadJob.s3Key);
      await runContractAnalysis(contractId, fileBuffer);
    } catch (analysisErr) {
      await markAnalysisFailed(contractId, analysisErr);
      const failed = await ContractModel.findById(contractId).populate('contractDocId');
      res.status(422).json({
        message: 'AI contract analysis failed',
        error: (analysisErr as Error).message,
        contract: failed,
      });
      return;
    }

    const updated = await ContractModel.findById(contractId).populate('contractDocId');
    res.status(201).json(updated);
  } catch (err) {
    next(err);
  }
};

export const listContracts = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const year = req.query.year as string | undefined;
    const name = req.query.name as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const skip = req.query.skip ? Number(req.query.skip) : 0;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (year) filter.start_date = { $regex: `^${year}` };

    const nameToSearch = name || search;
    if (nameToSearch) filter.name = { $regex: nameToSearch, $options: 'i' };

    const rawContracts = await ContractModel.find(filter)
      .select('name status contract_value currency start_date end_date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const contracts = rawContracts.map((c) => ({
      id: c._id?.toString(),
      name: c.name,
      status: c.status,
      contractValue: c.contract_value,
      currency: c.currency,
      startDate: c.start_date,
      endDate: c.end_date,
    }));

    res.json(contracts);
  } catch (err) {
    next(err);
  }
};

export const getContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('contractDocId');

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedMilestones = [...(contract.milestones || [])]
      .sort((a, b) => {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      })
      .map((m) => ({
        name: m.name,
        dueDate: m.due_date,
        isDue: m.due_date ? new Date(m.due_date) < today : false,
      }));

    const uploadJob = getPopulatedUploadJob(contract.contractDocId);

    const pdfUrl = uploadJob?.s3Key
      ? await getPresignedDownloadUrl(uploadJob.s3Key)
      : null;

    const contractObj = contract.toObject();
    const { _id, __v, contractDocId: _docRef, ...rest } = contractObj;
    const uploadedByRaw = rest.uploadedBy as { _id?: Types.ObjectId } | undefined;
    const { _id: uploadedId, ...uploadedByRest } = uploadedByRaw ?? {};

    res.json({
      ...rest,
      id: _id,
      uploadedBy: uploadedId
        ? { id: uploadedId, ...uploadedByRest }
        : rest.uploadedBy,
      milestones: sortedMilestones,
      document: uploadJob
        ? {
            uploadId: uploadJob._id,
            fileName: uploadJob.fileName,
            mimeType: uploadJob.mimeType,
            sizeBytes: uploadJob.sizeBytes,
            pdfUrl,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
};

export const updateContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    if (req.body?.status === 'active') {
      const contractValue = contract.contract_value ?? 0;
      if (
        contractValue &&
        contract.start_date &&
        contract.end_date &&
        contract.reporting_period
      ) {
        const forecast = generateBudgetPlan({
          contract_value: contractValue,
          start_date: contract.start_date,
          end_date: contract.end_date,
          reporting_period: contract.reporting_period,
          milestones: contract.milestones ?? [],
        });

        await PlannedBudgetModel.findOneAndUpdate(
          { contract: contract._id },
          {
            periods: forecast.periods.map((p) => ({
              periodLabel: p.label,
              startDate: new Date(p.startDate),
              endDate: new Date(p.endDate),
              plannedAmount: p.plannedAmount,
            })),
          },
          { upsert: true, new: true },
        );
      }
    }

    res.json({
      message: 'Successfully updated contract',
      id: contract._id,
    });
  } catch (err) {
    next(err);
  }
};

export const reanalyzeContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(req.params.id).populate('contractDocId');
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    const uploadJob = getPopulatedUploadJob(contract.contractDocId);
    if (!uploadJob?.s3Key) {
      res.status(400).json({ message: 'Contract has no linked upload document' });
      return;
    }

    const contractId = contract._id.toString();
    await ContractModel.findByIdAndUpdate(contractId, { status: 'processing' });

    downloadS3Object(uploadJob.s3Key)
      .then((buffer) => runContractAnalysis(contractId, buffer))
      .catch((err) => markAnalysisFailed(contractId, err));

    res.json({ message: 'Re-analysis started' });
  } catch (err) {
    next(err);
  }
};

export const getTimeline = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(
      req.params.id,
      'milestones start_date end_date',
    );
    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }
    res.json({
      milestones: contract.milestones,
      start_date: contract.start_date,
      end_date: contract.end_date,
    });
  } catch (err) {
    next(err);
  }
};
