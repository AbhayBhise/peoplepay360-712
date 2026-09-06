import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { passwordSchema } from "../../utils/passwordPolicy";
import { recordAudit } from "../../utils/audit";
import * as authService from "./auth.service";

const loginSchema = z.object({
  email: z.string().email({ message: "must be a valid email address" }),
  password: z.string().min(1, { message: "is required" }),
});



const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "is required" }),
  newPassword: passwordSchema,
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "must be a valid email address" }),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "is required" }),
  newPassword: passwordSchema,
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.login(body.email, body.password);
  return ok(res, result);
});



export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.auth!);
  return ok(res, result);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const body = changePasswordSchema.parse(req.body);
  await authService.changePassword(req.auth!, body.currentPassword, body.newPassword);
  await recordAudit(req, { module: "auth", action: "change_password", recordId: req.auth!.userId });
  return ok(res, { message: "Password changed successfully" });
});

// JWT auth is stateless — there is no server-side session to invalidate here. This
// endpoint exists so the frontend has something to call on sign-out (it already clears
// the token from localStorage client-side); a real token-revocation list would only be
// needed if we wanted to invalidate a token before its natural expiry.
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, { message: "Logged out successfully" });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = forgotPasswordSchema.parse(req.body);
  await authService.forgotPassword(body.email);
  return ok(res, { message: "If that email exists, a password reset link has been sent" });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = resetPasswordSchema.parse(req.body);
  await authService.resetPassword(body.token, body.newPassword);
  return ok(res, { message: "Password reset successfully" });
});
