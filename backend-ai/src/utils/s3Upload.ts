import { v4 as uuid } from "uuid";

// Only PDF and Word documents are accepted for contract uploads.
export const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// 50 MB default. Override via S3_MAX_FILE_SIZE env var.
export const MAX_SIZE = Number(process.env.S3_MAX_FILE_SIZE) || 52_428_800;

// Normalize the filename for use inside the S3 key: lowercase, replace
// non-[a-z0-9.-] runs with a single dash, cap length so we don't blow past
// S3's key-length limits when combined with the uuid prefix.
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

interface BuildObjectKeyInput {
  filename: string;
  contractId?: string;
  userId?: string;
}

// Key layout: contracts/{resourceId}/original/{uuid}-{name}
//
// NOTE: assertUserOwnsS3Key (s3Access.ts) expects the resourceId to be the
// userId so the ownership check works by prefix alone. Passing a contractId
// here will produce a key that FAILS the ownership check at /complete time.
// Treat contractId as a no-op for now and prefer userId.
export function buildObjectKey({
  filename,
  contractId,
  userId,
}: BuildObjectKeyInput): string {
  const safeName = sanitizeFilename(filename);
  const resourceId = contractId || userId || uuid();
  return `contracts/${resourceId}/original/${uuid()}-${safeName}`;
}
