import mongoose, { Document, Schema, Types } from 'mongoose';

export type UploadJobStatus = 'uploaded' | 'linked';

export interface IUploadJob extends Document {
  s3Key: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: UploadJobStatus;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// UploadJob — records a successful direct-to-S3 upload. Lifecycle:
//   uploaded (just landed in S3) -> linked (attached to a Contract).
const uploadJobSchema = new Schema<IUploadJob>(
  {
    s3Key: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    status: {
      type: String,
      enum: ['uploaded', 'linked'],
      default: 'uploaded',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Lets uploadController.completeUpload safely upsert: a retried "complete"
// call for the same (user, S3 key) updates the existing record instead of
// creating a duplicate.
uploadJobSchema.index({ s3Key: 1, uploadedBy: 1 }, { unique: true });

export const UploadJobModel = mongoose.model<IUploadJob>(
  'UploadJob',
  uploadJobSchema,
);
