import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

export type Role = "user" | "moderator" | "admin";

export const authorize = (requiredRole: Role | Role[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        statusCode: 401,
        message: "Authentication required",
      });
    }

    const permittedRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    const userRole = (req.user as any).role as Role;

    if (!permittedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: "You are not authorized to access this resource",
      });
    }

    next();
  };
};
