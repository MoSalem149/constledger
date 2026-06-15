import { v4 as uuid } from 'uuid';

export const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const MAX_SIZE = Number(process.env.S3_MAX_FILE_SIZE) || 52_428_800;

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

export function buildObjectKey({
  filename,
  contractId,
  userId,
}: BuildObjectKeyInput): string {
  const safeName = sanitizeFilename(filename);
  const resourceId = contractId || userId || uuid();
  return `contracts/${resourceId}/original/${uuid()}-${safeName}`;
}
