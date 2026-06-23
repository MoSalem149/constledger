import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';

import { s3Client } from '../config/s3';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { UploadJobModel } from '../models/UploadJob.model';
import { assertUserOwnsS3Key } from '../utils/s3Access';
import { ALLOWED_MIME, MAX_SIZE, buildObjectKey } from '../utils/s3Upload';

// POST /api/uploads/sign — returns a presigned S3 PUT URL the browser can
// use to upload the contract file directly to S3 (bytes never proxy through
// this server).
export const signUpload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { filename, mimeType, size, contractId, fileHash } = req.body as {
      filename?: string;
      mimeType?: string;
      size?: number;
      contractId?: string;
      fileHash?: string;
    };

    if (!filename || !mimeType || size == null || !fileHash) {
      res
        .status(400)
        .json({ message: 'filename, mimeType, size, and fileHash are required' });
      return;
    }
    // fileHash must be a SHA-256 hex digest computed client-side over the
    // raw file bytes (e.g. crypto.subtle.digest('SHA-256', file)).
    if (!/^[a-f0-9]{64}$/i.test(fileHash)) {
      res.status(400).json({ message: 'fileHash must be a SHA-256 hex digest' });
      return;
    }
    // Security: enforce mime allow-list and size cap server-side. Trusting the
    // client values would let an attacker upload arbitrary content.
    if (!ALLOWED_MIME.has(mimeType)) {
      res.status(400).json({ message: 'Unsupported file type' });
      return;
    }
    if (Number(size) > MAX_SIZE) {
      res.status(400).json({ message: 'File exceeds 50MB limit' });
      return;
    }

    // Reject duplicates before we even hand out a presigned URL, so the
    // browser never wastes bandwidth uploading content we already have.
    const existing = await UploadJobModel.findOne({ fileHash });
    if (existing) {
      res.status(409).json({
        message: 'This file has already been uploaded',
        existingUploadId: existing._id,
        existingFileName: existing.fileName,
      });
      return;
    }

    const key = buildObjectKey({
      filename,
      contractId,
      userId: req.user?.id,
    });

    // 5 minutes is plenty for the browser to finish a single PUT
    const expiresIn = Number(process.env.S3_UPLOAD_URL_TTL) || 300;

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: mimeType,
        ChecksumAlgorithm: undefined,   // ← explicitly opt out
      }),
      { expiresIn, unhoistableHeaders: new Set(['x-amz-checksum-crc32']) },
    );

    res.json({ uploadUrl, key, expiresIn });
  } catch (err) {
    next(err);
  }
};

// POST /api/uploads/complete — client tells us the S3 upload finished; we
// record an UploadJob. Upsert on (s3Key, uploadedBy) so a retried "complete"
// call is idempotent.
export const completeUpload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { s3Key, fileName, mimeType, size, fileHash } = req.body as {
      s3Key?: string;
      fileName?: string;
      mimeType?: string;
      size?: number;
      fileHash?: string;
    };

    if (!s3Key || !fileName || !mimeType || size == null || !fileHash) {
      res
        .status(400)
        .json({ message: 's3Key, fileName, mimeType, size, and fileHash are required' });
      return;
    }
    if (!/^[a-f0-9]{64}$/i.test(fileHash)) {
      res.status(400).json({ message: 'fileHash must be a SHA-256 hex digest' });
      return;
    }
    if (!ALLOWED_MIME.has(mimeType)) {
      res.status(400).json({ message: 'Unsupported file type' });
      return;
    }
    if (Number(size) > MAX_SIZE) {
      res.status(400).json({ message: 'File exceeds 50MB limit' });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;

    // Security: the S3 key must live under this user's own prefix so a user
    // cannot attach someone else's uploaded file to their own account.
    assertUserOwnsS3Key(s3Key, userId);

    const uploadedBy = new Types.ObjectId(userId);

    let uploadJob;
    try {
      uploadJob = await UploadJobModel.findOneAndUpdate(
        { s3Key, uploadedBy },
        {
          s3Key,
          fileName,
          mimeType,
          sizeBytes: Number(size),
          fileHash,
          uploadedBy,
          status: 'uploaded',
        },
        { upsert: true, new: true, runValidators: true },
      );
    } catch (err: any) {
      // Two concurrent signUpload calls for the same content can both pass
      // the pre-check race; the unique index on fileHash is the final
      // backstop here.
      if (err?.code === 11000 && err?.keyPattern?.fileHash) {
        res.status(409).json({ message: 'This file has already been uploaded' });
        return;
      }
      throw err;
    }

    res.status(201).json({
      uploadId: uploadJob._id,
      s3Key: uploadJob.s3Key,
      status: uploadJob.status,
    });
  } catch (err) {
    next(err);
  }
};