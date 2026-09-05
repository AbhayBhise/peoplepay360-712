import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { parsePagination } from "../../utils/pagination";
import * as auditLogService from "./auditLog.service";

// Always paginated (not opt-in like other list endpoints) — an audit log only grows,
// never shrinks, so there's no safe "give me everything" default here.
export const list = asyncHandler(async (req: Request, res: Response) => {
  const filters = {
    module: typeof req.query.module === "string" ? req.query.module : undefined,
    userId: typeof req.query.user_id === "string" ? req.query.user_id : undefined,
  };
  return ok(res, await auditLogService.listAuditLogs(filters, parsePagination(req)));
});
