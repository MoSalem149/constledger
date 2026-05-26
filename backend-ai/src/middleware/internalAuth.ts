import { Request, Response, NextFunction } from 'express';

/**
 * Validates the x-internal-secret header.
 * Only the core backend (or authorized callers) can hit the AI service directly.
 */
export const internalOnly = (req: Request, res: Response, next: NextFunction): void => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    res.status(403).json({ message: 'Forbidden — internal service only' });
    return;
  }
  next();
};
