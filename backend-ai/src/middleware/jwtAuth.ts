/**
 * jwtAuth.ts
 *
 * Validates the JWT stored in the httpOnly cookie.
 * The token is verified against the same JWT_SECRET used by the core backend.
 * Attaches the decoded payload to req.user so controllers can access userId/role.
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  user?: { id: string; role: string };
};

export const jwtAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const token = req.cookies?.token;
  if (!token) {
    res.status(401).json({ message: "Unauthorized — auth cookie required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    res
      .status(401)
      .json({ message: "Unauthorized — invalid or expired token" });
  }
};
