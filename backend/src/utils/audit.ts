import { Request } from "express";
import { prisma } from "../prisma";

// docs/01_DATABASE_SCHEMA.md defines audit_log for exactly this — an accountability trail
// for who changed what in an HR/payroll system — but nothing was writing to it. Wired into
// the most sensitive mutations: Employee, Contract, and Payrun state transitions.
export async function recordAudit(
  req: Request,
  params: { module: string; action: string; recordId?: string; before?: unknown; after?: unknown }
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.auth?.userId,
        module: params.module,
        action: params.action,
        recordId: params.recordId,
        beforeValue: params.before === undefined ? undefined : (params.before as object),
        afterValue: params.after === undefined ? undefined : (params.after as object),
        ipAddress: req.ip,
      },
    });
  } catch (err) {
    // Audit logging must never break the actual request it's observing.
    console.error("audit log write failed:", err);
  }
}
