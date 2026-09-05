import { Request } from "express";
import { auditWriteBuffer } from "./writeBuffer";

// High-throughput audit logging queue. Buffers incoming requests up to count threshold
// and flushes gathered records in a single bulk database query to handle high concurrency.
export async function recordAudit(
  req: Request,
  params: { module: string; action: string; recordId?: string; before?: unknown; after?: unknown }
) {
  try {
    auditWriteBuffer.enqueue({
      userId: req.auth?.userId,
      module: params.module,
      action: params.action,
      recordId: params.recordId,
      beforeValue: params.before === undefined ? null : (params.before as object),
      afterValue: params.after === undefined ? null : (params.after as object),
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error("audit log write buffer error:", err);
  }
}

