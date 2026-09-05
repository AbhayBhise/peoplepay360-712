import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as authService from "./auth.service";

const loginSchema = z.object({
  email: z.string().email({ message: "must be a valid email address" }),
  password: z.string().min(1, { message: "is required" }),
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
