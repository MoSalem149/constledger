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
