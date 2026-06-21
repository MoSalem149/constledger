import { v4 as uuid } from 'uuid';

// Only PDF and Word documents are accepted for contract uploads.
export const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// 50 MB default. Override via S3_MAX_FILE_SIZE env var.
export const MAX_SIZE = Number(process.env.S3_MAX_FILE_SIZE) || 52_428_800;

// Normalize the filename for use inside the S3 key: lowercase, replace
// non-[a-z0-9.-] runs with a single dash, cap length so we don't blow past
// S3's key-length limits when combined with the uuid prefix.
export function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

interface BuildObjectKeyInput {
  filename: string;
  contractId?: string;
  userId?: string;
}

// Key layout: contracts/{resourceId}/original/{uuid}-{name}
//
// IMPORTANT: assertUserOwnsS3Key (s3Access.ts) checks the key against the
// prefix `contracts/{userId}/`, so resourceId MUST be the userId whenever
// one is available. contractId is accepted for backwards compatibility but
// must never take precedence — doing so produces a key that fails the
// ownership check at /complete time.
export function buildObjectKey({
  filename,
  contractId,
  userId,
}: BuildObjectKeyInput): string {
  const safeName = sanitizeFilename(filename);
  const resourceId = userId || contractId || uuid();
  return `contracts/${resourceId}/original/${uuid()}-${safeName}`;
}
