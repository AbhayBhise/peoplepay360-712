import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { createAllocationSchema } from "./timeOff.validation";

type CreateInput = z.infer<typeof createAllocationSchema>;

function withRemaining<T extends { allocated: unknown; taken: unknown }>(allocation: T) {
  const allocated = Number(allocation.allocated);
  const taken = Number(allocation.taken);
  return { ...allocation, remaining: Math.round((allocated - taken) * 100) / 100 };
}

export function listAllocations(
  auth: AuthPayload,
  filters: { employeeId?: string; typeId?: string; status?: string }
) {
  const visibilityFilter = isHrmPlus(auth.roles)
    ? {}
    : { employeeId: auth.employeeId ?? "__no_self_employee__" };

  return prisma.timeOffAllocation
    .findMany({
      where: {
        ...visibilityFilter,
        employeeId: filters.employeeId || undefined,
        typeId: filters.typeId || undefined,
        status: (filters.status as "draft" | "validate" | "refused") || undefined,
      },
      orderBy: { validFrom: "desc" },
    })
    .then((rows) => rows.map(withRemaining));
}

export async function createAllocation(input: CreateInput) {
  const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee) throw ApiError.badRequest(`employeeId: no employee with id ${input.employeeId}`);

  const type = await prisma.timeOffType.findUnique({ where: { id: input.typeId } });
  if (!type) throw ApiError.badRequest(`typeId: no time off type with id ${input.typeId}`);

  return prisma.timeOffAllocation.create({
    data: {
      employeeId: input.employeeId,
      typeId: input.typeId,
      allocated: input.allocated,
      validFrom: input.validFrom ?? new Date(),
      validTo: input.validTo ?? undefined,
      status: "draft",
    },
  });
}

// Balance only becomes usable once approved — docs/roles/BACKEND.md / manage-leave.md workflow.
export async function approveAllocation(id: string) {
  const allocation = await prisma.timeOffAllocation.findUnique({ where: { id } });
  if (!allocation) throw ApiError.notFound(`allocation: no allocation with id ${id}`);
  if (allocation.status !== "draft") {
    throw ApiError.conflict(`allocation: cannot approve an allocation in status '${allocation.status}'`);
  }
  return prisma.timeOffAllocation.update({ where: { id }, data: { status: "validate" } });
}

// Used by the request-balance check — pooled remaining balance across all currently-valid,
// approved allocations for this employee+type (docs/roles/BACKEND.md manage-leave workflow).
export async function getUsableAllocations(employeeId: string, typeId: string, asOf: Date) {
  return prisma.timeOffAllocation.findMany({
    where: {
      employeeId,
      typeId,
      status: "validate",
      validFrom: { lte: asOf },
      OR: [{ validTo: null }, { validTo: { gte: asOf } }],
    },
    orderBy: { validFrom: "asc" },
  });
}
