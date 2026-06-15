import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';

import { s3Client } from '../config/s3';
import { AuthenticatedRequest } from '../middleware/jwtAuth';
import { UploadJobModel } from '../models/UploadJob.model';
import { assertUserOwnsS3Key } from '../utils/s3Access';
import { ALLOWED_MIME, MAX_SIZE, buildObjectKey } from '../utils/s3Upload';

export const signUpload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { filename, mimeType, size, contractId } = req.body as {
      filename?: string;
      mimeType?: string;
      size?: number;
      contractId?: string;
    };

    if (!filename || !mimeType || size == null) {
      res
        .status(400)
        .json({ message: 'filename, mimeType, and size are required' });
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

    const key = buildObjectKey({
      filename,
      contractId,
      userId: req.user?.id,
    });

    const expiresIn = Number(process.env.S3_UPLOAD_URL_TTL) || 300;

    const uploadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: mimeType,
      }),
      { expiresIn },
    );

    res.json({ uploadUrl, key, expiresIn });
  } catch (err) {
    next(err);
  }
};

export const completeUpload = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { s3Key, fileName, mimeType, size } = req.body as {
      s3Key?: string;
      fileName?: string;
      mimeType?: string;
      size?: number;
    };
    console.log(s3Key, fileName, mimeType, size)
    if (!s3Key || !fileName || !mimeType || size == null) {
      res
        .status(400)
        .json({ message: 's3Key, fileName, mimeType, and size are required' });
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
    assertUserOwnsS3Key(s3Key, userId);

    const uploadedBy = new Types.ObjectId(userId);

    const uploadJob = await UploadJobModel.findOneAndUpdate(
      { s3Key, uploadedBy },
      {
        s3Key,
        fileName,
        mimeType,
        sizeBytes: Number(size),
        uploadedBy,
        status: 'uploaded',
      },
      { upsert: true, new: true, runValidators: true },
    );

    res.status(201).json({
      uploadId: uploadJob._id,
      s3Key: uploadJob.s3Key,
      status: uploadJob.status,
    });
  } catch (err) {
    next(err);
  }
};
