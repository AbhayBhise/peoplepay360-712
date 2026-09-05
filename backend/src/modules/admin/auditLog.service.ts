import { prisma } from "../../prisma";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

// The audit trail has been written to on every sensitive mutation (Employee, Contract,
// Payrun, user management, change-password) all session — this is what finally makes it
// visible to anyone. Admin-only: it's the one place every user's activity is readable
// across role boundaries, so it can't be opened up the way other list endpoints are.
export async function listAuditLogs(
  filters: { module?: string; userId?: string },
  pagination: PaginationParams
) {
  const where = {
    module: filters.module || undefined,
    userId: filters.userId || undefined,
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { user: { select: { id: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return paginatedResult(items, total, pagination);
}
