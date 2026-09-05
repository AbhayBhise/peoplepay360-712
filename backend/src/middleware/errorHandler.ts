import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

// Structured error envelope everywhere, per docs/00_PROJECT_BRIEF.md — never a bare 500,
// never a raw stack trace to the client.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(`ApiError [${req.method} ${req.url}]: ${err.message}`, { statusCode: err.statusCode });
    } else {
      logger.warn(`ApiError [${req.method} ${req.url}]: ${err.message}`, { statusCode: err.statusCode });
    }
    return res.status(err.statusCode).json({ success: false, error: err.message });
  }

  if (err instanceof ZodError) {
    const first = err.issues[0];
    const field = first?.path.join(".") || "field";
    const msg = `${field}: ${first?.message}`;
    logger.warn(`ValidationError [${req.method} ${req.url}]: ${msg}`);
    return res.status(422).json({ success: false, error: msg });
  }

  logger.error(`UnhandledException [${req.method} ${req.url}]`, { error: err });
  return res.status(500).json({ success: false, error: "internal: unexpected server error" });
}
