// Security check — every contract file MUST be keyed under contracts/{userId}/.
// This enforces that a user can only reference S3 objects inside their own
// prefix. Without it, completeUpload would let any authenticated user attach
// an arbitrary S3 key (including another user's file) to their account.
export function assertUserOwnsS3Key(s3Key: string, userId: string): void {
  const prefix = `contracts/${userId}/`;
  if (!s3Key || !s3Key.startsWith(prefix)) {
    const err = new Error('You do not have access to this file') as Error & {
      statusCode: number;
    };
    err.statusCode = 403;
    throw err;
  }
}
