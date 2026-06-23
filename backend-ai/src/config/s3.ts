import { S3Client } from '@aws-sdk/client-s3';

// Single, shared S3 client. Credentials are read once at startup from env;
// IAM permissions needed: s3:GetObject and s3:PutObject on the configured bucket.
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});
