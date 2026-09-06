import { z } from "zod";

// Single source of truth for password strength — reused by admin user creation,
// self-service change-password, and password reset, so the rule can never drift
// between those three entry points.
export const passwordSchema = z.string().min(8, { message: "must be at least 8 characters" });
