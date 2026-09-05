import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export type RoleName =
  | "EMPLOYEE"
  | "HR_MANAGER"
  | "HR_PAYROLL_USER"
  | "HR_PAYROLL_MANAGER"
  | "ADMIN";

export interface AuthPayload {
  userId: string;
  employeeId: string | null;
  roles: RoleName[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

// Route/Data layer of the RBAC pipeline (docs/roles/ARCHITECT.md) — Navigation is the
// frontend's job, but this middleware is what actually protects every route regardless
// of what the frontend does or doesn't show.
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  // A direct browser navigation (e.g. a "Print PDF" link opened in a new tab) cannot set
  // a custom Authorization header — there's no JS request in the loop to attach one. The
  // ?token= query param is the standard fallback for exactly this case (same pattern as
  // signed download URLs elsewhere); still requires a valid JWT, just carried differently.
  const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : queryToken;

  if (!token) {
    throw ApiError.unauthorized("missing bearer token");
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    throw ApiError.unauthorized("invalid or expired token");
  }
}

// Usage: requireRole("HR_MANAGER", "ADMIN") — pass every role allowed to call the route.
export function requireRole(...allowed: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      throw ApiError.unauthorized();
    }
    const hasRole = req.auth.roles.some((role) => allowed.includes(role));
    if (!hasRole) {
      throw ApiError.forbidden(`requires one of: ${allowed.join(", ")}`);
    }
    next();
  };
}

export const HRM_PLUS: RoleName[] = [
  "HR_MANAGER",
  "HR_PAYROLL_USER",
  "HR_PAYROLL_MANAGER",
  "ADMIN",
];

export const HRPU_PLUS: RoleName[] = ["HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"];
export const HRPM_PLUS: RoleName[] = ["HR_PAYROLL_MANAGER", "ADMIN"];

export function isHrmPlus(roles: RoleName[]): boolean {
  return roles.some((r) => HRM_PLUS.includes(r));
}
