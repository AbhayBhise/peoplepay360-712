import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { createRequestSchema } from "./timeOff.validation";
import { getUsableAllocations } from "./timeOffAllocation.service";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

type CreateInput = z.infer<typeof createRequestSchema>;

// Excludes weekends, per manage-leave.md ("duration in days, exclude weekends").
// Working-schedule-aware weekday exclusion would be a further refinement; Sat/Sun is the
// baseline every employee shares regardless of their specific schedule.
function countWeekdays(dateFrom: Date, dateTo: Date): number {
  let count = 0;
  const cursor = new Date(dateFrom);
  while (cursor <= dateTo) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function assertSelfOrHrmPlus(auth: AuthPayload, employeeId: string) {
  if (!isHrmPlus(auth.roles) && auth.employeeId !== employeeId) {
    throw ApiError.forbidden("you may only manage your own time off requests");
  }
}

// Pagination is opt-in — see employee.service.ts for the same pattern and why.
export async function listRequests(
  auth: AuthPayload,
  filters: { employeeId?: string; status?: string },
  pagination?: PaginationParams
) {
  const visibilityFilter = isHrmPlus(auth.roles)
    ? {}
    : { employeeId: auth.employeeId ?? "__no_self_employee__" };

  const where = {
    ...visibilityFilter,
    employeeId: filters.employeeId || undefined,
    status: (filters.status as "draft" | "validate" | "refused") || undefined,
  };
  const relations = {
    employee: { select: { id: true, name: true } },
    type: { select: { id: true, name: true } },
  } as const;

  if (!pagination) {
    return prisma.timeOffRequest.findMany({ where, orderBy: { dateFrom: "desc" }, include: relations });
  }

  const [rows, total] = await Promise.all([
    prisma.timeOffRequest.findMany({
      where,
      orderBy: { dateFrom: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: relations,
    }),
    prisma.timeOffRequest.count({ where }),
  ]);
  return paginatedResult(rows, total, pagination);
}

// Real-time remaining-balance lookup backing the frontend's "show balance before submit"
// requirement (docs/roles/FRONTEND.md).
export async function getRemainingBalance(employeeId: string, typeId: string, asOf = new Date()) {
  const type = await prisma.timeOffType.findUnique({ where: { id: typeId } });
  if (!type) throw ApiError.badRequest(`typeId: no time off type with id ${typeId}`);
  if (!type.requiresAllocation) return { requiresAllocation: false, remaining: null };

  const allocations = await getUsableAllocations(employeeId, typeId, asOf);
  const remaining = allocations.reduce((sum, a) => sum + (Number(a.allocated) - Number(a.taken)), 0);
  return { requiresAllocation: true, remaining: Math.round(remaining * 100) / 100 };
}

export async function createRequest(auth: AuthPayload, input: CreateInput) {
  assertSelfOrHrmPlus(auth, input.employeeId);

  const type = await prisma.timeOffType.findUnique({ where: { id: input.typeId } });
  if (!type) throw ApiError.badRequest(`typeId: no time off type with id ${input.typeId}`);

  const duration = countWeekdays(input.dateFrom, input.dateTo);
  if (duration <= 0) {
    throw ApiError.badRequest("dateTo: range contains no working days");
  }

  if (type.requiresAllocation) {
    const { remaining } = await getRemainingBalance(input.employeeId, input.typeId, input.dateFrom);
    if (remaining !== null && duration > remaining) {
      throw ApiError.conflict(`timeOff: insufficient balance, remaining ${remaining} ${type.unit}`);
    }
  }

  return prisma.timeOffRequest.create({
    data: {
      employeeId: input.employeeId,
      typeId: input.typeId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      duration,
      status: "draft",
    },
  });
}

// Approval and balance deduction happen atomically (docs/roles/ARCHITECT.md transaction
// boundary decision) — either both happen or neither does.
export async function approveRequest(id: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.timeOffRequest.findUnique({ where: { id } });
    if (!request) throw ApiError.notFound(`timeOffRequest: no request with id ${id}`);
    if (request.status !== "draft") {
      throw ApiError.conflict(`timeOffRequest: cannot approve a request in status '${request.status}'`);
    }

    const type = await tx.timeOffType.findUnique({ where: { id: request.typeId } });
    if (!type) throw ApiError.notFound(`timeOffType: no type with id ${request.typeId}`);

    if (type.requiresAllocation) {
      const allocations = await tx.timeOffAllocation.findMany({
        where: {
          employeeId: request.employeeId,
          typeId: request.typeId,
          status: "validate",
          validFrom: { lte: request.dateFrom },
          OR: [{ validTo: null }, { validTo: { gte: request.dateFrom } }],
        },
        orderBy: { validFrom: "asc" },
      });

      let remainingToDeduct = Number(request.duration);
      const totalAvailable = allocations.reduce((sum, a) => sum + (Number(a.allocated) - Number(a.taken)), 0);
      if (remainingToDeduct > totalAvailable) {
        throw ApiError.conflict(`timeOff: insufficient balance, remaining ${totalAvailable} ${type.unit}`);
      }

      // FIFO deduction across whichever allocations are currently valid.
      for (const allocation of allocations) {
        if (remainingToDeduct <= 0) break;
        const available = Number(allocation.allocated) - Number(allocation.taken);
        const deduction = Math.min(available, remainingToDeduct);
        if (deduction <= 0) continue;
        await tx.timeOffAllocation.update({
          where: { id: allocation.id },
          data: { taken: { increment: deduction } },
        });
        remainingToDeduct -= deduction;
      }
    }

    return tx.timeOffRequest.update({ where: { id }, data: { status: "validate" } });
  });
}

// Refusal never touches the allocation balance — it was never deducted (manage-leave.md).
export async function refuseRequest(id: string) {
  const request = await prisma.timeOffRequest.findUnique({ where: { id } });
  if (!request) throw ApiError.notFound(`timeOffRequest: no request with id ${id}`);
  if (request.status !== "draft") {
    throw ApiError.conflict(`timeOffRequest: cannot refuse a request in status '${request.status}'`);
  }
  return prisma.timeOffRequest.update({ where: { id }, data: { status: "refused" } });
}
