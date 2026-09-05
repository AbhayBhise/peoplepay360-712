import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

// Structured error envelope everywhere, per docs/00_PROJECT_BRIEF.md — never a bare 500,
// never a raw stack trace to the client.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path.join(".") || "field";
    return res.status(422).json({ success: false, error: `${field}: ${first?.message}` });
  }

  console.error(err);
  return res.status(500).json({ success: false, error: "internal: unexpected server error" });
}
