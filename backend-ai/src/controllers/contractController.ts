import { randomUUID } from "crypto";
import { Response, NextFunction } from "express";
import { Types } from "mongoose";

import { connectDatabase } from "../config/database";
import { AuthenticatedRequest } from "../middleware/jwtAuth";
import { ContractModel } from "../models/Contract.model";
import { UploadJobModel, IUploadJob } from "../models/UploadJob.model";
import { runContractAnalysis } from "../services/contract-analysis/runContractAnalysis";
import { downloadS3Object, getPresignedDownloadUrl } from "../utils/s3Storage";

// Background-task error sink — flips status to analysis_failed so the
// frontend's poll loop can stop and surface the error to the user.
const markAnalysisFailed = async (
  contractId: string,
  err: unknown,
): Promise<void> => {
  console.error(`[analyze] failed for ${contractId}:`, (err as Error).message);
  await ContractModel.findByIdAndUpdate(contractId, {
    status: "analysis_failed",
  });
};

// Ownership check — the upload must exist AND have been uploaded by the
// requesting user.
async function resolveUploadJob(uploadId: string, userId: string) {
  const uploadJob = await UploadJobModel.findById(uploadId);
  if (!uploadJob) return { error: "Upload record not found" as const };
  if (uploadJob.uploadedBy.toString() !== userId) {
    return { error: "You do not have access to this upload" as const };
  }
  return { uploadJob };
}

// contractDocId is either an unpopulated ObjectId or a populated UploadJob doc.
// Returns the populated form when present, null otherwise.
function getPopulatedUploadJob(
  contractDocId: Types.ObjectId | IUploadJob | undefined,
): IUploadJob | null {
  if (!contractDocId || contractDocId instanceof Types.ObjectId) return null;
  return contractDocId;
}

// POST /api/contracts/upload — links an UploadJob to a brand-new Contract and
// kicks off background AI analysis. Returns 202 immediately; the client polls
// GET /api/contracts/:id until status leaves 'processing'.
export const uploadContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { uploadId, name } = req.body as { uploadId?: string; name?: string };
    if (!uploadId) {
      res.status(400).json({ message: "uploadId is required" });
      return;
    }

    await connectDatabase();

    const resolved = await resolveUploadJob(uploadId, req.user!.id);
    if ("error" in resolved) {
      res
        .status(resolved.error === "Upload record not found" ? 404 : 403)
        .json({
          message: resolved.error,
        });
      return;
    }

    const { uploadJob } = resolved;

    // One UploadJob can back at most one Contract — reject reuse with 409.
    const alreadyLinked = await ContractModel.findOne({
      contractDocId: uploadJob._id,
    });
    if (alreadyLinked) {
      res
        .status(409)
        .json({ message: "This upload is already linked to a contract" });
      return;
    }

    const contract = await ContractModel.create({
      contractNumber: `CPMS-${randomUUID()}`,
      name: name || uploadJob.fileName,
      contractDocId: uploadJob._id,
      uploadedBy: req.user!.id,
      status: "processing",
    });

    await UploadJobModel.findByIdAndUpdate(uploadJob._id, { status: "linked" });

    const contractId = contract._id.toString();

    // Fire-and-forget — run the OCR + LLM pipeline in the background and
    // respond now. Vercel and most proxies enforce a 60s hard timeout, so
    // awaiting the full pipeline here would always produce a 502.
    downloadS3Object(uploadJob.s3Key)
      .then((buffer) => runContractAnalysis(contractId, buffer))
      .catch((err) => markAnalysisFailed(contractId, err));

    res.status(202).json({
      id: contractId,
      name: contract.name,
      status: "processing",
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contracts/ — list with optional filters and pagination
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
    const paginated = req.query.paginated === "true";
    const requestedLimit = Number(req.query.limit ?? 10);
    const requestedSkip = Number(req.query.skip ?? 0);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
      : 10;
    const skip = Number.isFinite(requestedSkip)
      ? Math.max(Math.trunc(requestedSkip), 0)
      : 0;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    else if (typeof req.query.excludeStatuses === "string") {
      const excludedStatuses = req.query.excludeStatuses
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (excludedStatuses.length > 0) {
        filter.status = { $nin: excludedStatuses };
      }
    }
    // start_date is stored as a YYYY-MM-DD string; a year filter just regexes the prefix
    if (year) filter.start_date = { $regex: `^${year}` };

    // `name` and `search` are aliases — both do a case-insensitive substring match
    const nameToSearch = name || search;
    if (nameToSearch) {
      const escapedSearch = nameToSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        {
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: escapedSearch,
              options: "i",
            },
          },
        },
      ];
    }

    const [rawContracts, total] = await Promise.all([
      ContractModel.find(filter)
        .select(
          "name status contract_value currency start_date end_date contractNumber parties milestones",
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ContractModel.countDocuments(filter),
    ]);

    // Reshape into the API response shape — flatten _id and rename snake_case fields
    const contracts = rawContracts.map((c) => ({
      id: c._id?.toString(),
      name: c.name,
      status: c.status,
      contractValue: c.contract_value,
      currency: c.currency,
      startDate: c.start_date,
      endDate: c.end_date,
      contractNumber: c.contractNumber,
      parties: c.parties,
      milestones: c.milestones?.map((m) => ({
        name: m.name,
        dueDate: m.due_date,
        value: m.value,
      })),
    }));

    if (paginated) {
      res.json({
        contracts,
        pagination: {
          total,
          limit,
          skip,
          page: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(total / limit),
        },
      });
      return;
    }

    res.json(contracts);
  } catch (err) {
    next(err);
  }
};

// GET /api/contracts/:id — full contract document plus uploader info and a
// short-lived presigned URL the frontend can use to render the PDF.
export const getContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .populate("contractDocId");

    if (!contract) {
      res.status(404).json({ message: "Contract not found" });
      return;
    }

    // Today at 00:00 local for the milestone "is overdue" check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort milestones chronologically (undated milestones to the end) and
    // flag the ones whose due date has already passed.
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

    // Reshape the Mongo document into the API response shape: drop internal
    // ids, rename _id -> id, and flatten the populated refs.
    const contractObj = contract.toObject();
    const { _id, __v, contractDocId: _docRef, ...rest } = contractObj;
    const uploadedByRaw = rest.uploadedBy as
      | { _id?: Types.ObjectId }
      | undefined;
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

// PUT /api/contracts/:id — generic edit. runValidators makes Mongoose apply
// schema-level validation on update (not the default).
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
      res.status(404).json({ message: "Contract not found" });
      return;
    }
    res.json({
      message: "Successfully updated contract",
      id: contract._id,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/contracts/:id — permanently removes a contract.
//
// Role note: the route for this (see contractRoutes.ts) is locked to
// contract_manager ONLY. All mutations on this resource are restricted
// to contract_manager; only reads are open to other authenticated roles.
export const deleteContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(req.params.id);
    if (!contract) {
      res.status(404).json({ message: "Contract not found" });
      return;
    }

    // The linked UploadJob can only ever back this one contract (see the
    // 409 check in uploadContract), so it has no value once the contract
    // is gone — clean it up too rather than leaving an orphaned record.
    if (contract.contractDocId) {
      await UploadJobModel.findByIdAndDelete(contract.contractDocId);
    }

    await ContractModel.findByIdAndDelete(req.params.id);

    res.json({ message: "Contract deleted", id: req.params.id });
  } catch (err) {
    next(err);
  }
};

// POST /api/contracts/:id/analyze — re-run AI analysis on the already-linked
// document. Uses the same fire-and-forget pattern as uploadContract.
export const reanalyzeContract = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const contract = await ContractModel.findById(req.params.id).populate(
      "contractDocId",
    );
    if (!contract) {
      res.status(404).json({ message: "Contract not found" });
      return;
    }

    const uploadJob = getPopulatedUploadJob(contract.contractDocId);
    if (!uploadJob?.s3Key) {
      res
        .status(400)
        .json({ message: "Contract has no linked upload document" });
      return;
    }

    const contractId = contract._id.toString();
    await ContractModel.findByIdAndUpdate(contractId, { status: "processing" });

    downloadS3Object(uploadJob.s3Key)
      .then((buffer) => runContractAnalysis(contractId, buffer))
      .catch((err) => markAnalysisFailed(contractId, err));

    res.json({ message: "Re-analysis started" });
  } catch (err) {
    next(err);
  }
};