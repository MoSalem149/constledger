import { Request, Response, NextFunction } from 'express';

// 404 fallthrough — registered after all routers
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

// Centralized error handler — logs every error and returns JSON. Stack traces
// only leak outside production.
export const errorHandler = (
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.statusCode || 500;
  console.error(`[ai-error] ${err.message}`);
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
