import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & {
  user?: { id: string; role: string };
};

// Verifies the JWT from the httpOnly auth cookie against JWT_SECRET.
// This service NEVER issues tokens — JWT_SECRET must match backend-core
// exactly, since backend-core is the only service that signs them.
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
