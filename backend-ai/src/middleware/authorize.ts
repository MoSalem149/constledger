import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './jwtAuth';

// Role gate — must run AFTER jwtAuth so req.user is populated.
export const authorize =
  (...roles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      res.status(403).json({ message: `Role '${req.user?.role ?? 'unknown'}' is not allowed` });
      return;
    }
    next();
  };
