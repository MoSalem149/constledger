import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3Client } from "../config/s3";

// Streams an S3 object fully into memory as a Buffer. Used by the contract
// analysis pipeline to hand the PDF to pdfjs / Tesseract.
export async function downloadS3Object(key: string): Promise<Buffer> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured");

  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes?.length) throw new Error(`Empty S3 object: ${key}`);
  return Buffer.from(bytes);
}

// Short-lived presigned GET URL — used by the frontend to render the contract
// PDF inline. Returns null on any signing error so the API still responds.
export async function getPresignedDownloadUrl(
  key: string,
): Promise<string | null> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket || !key) return null;

  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: Number(process.env.S3_DOWNLOAD_URL_TTL) || 900 },
    );
  } catch (err) {
    console.warn(
      "[s3] Could not generate pre-signed URL:",
      (err as Error).message,
    );
    return null;
  }
}
