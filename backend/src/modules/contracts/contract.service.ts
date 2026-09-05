import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { createContractSchema, updateContractSchema } from "./contract.validation";

type CreateInput = z.infer<typeof createContractSchema>;
type UpdateInput = z.infer<typeof updateContractSchema>;

const FAR_FUTURE = new Date("9999-12-31");

function rangesOverlap(aStart: Date, aEnd: Date | null, bStart: Date, bEnd: Date | null): boolean {
  const aEndVal = aEnd ?? FAR_FUTURE;
  const bEndVal = bEnd ?? FAR_FUTURE;
  return aStart <= bEndVal && bStart <= aEndVal;
}

// docs/01_DATABASE_SCHEMA.md / roles/DATABASE.md: no two overlapping ACTIVE contracts for the
// same employee. This is the app-level enforcement; Disha's DB-level exclusion constraint
// (backend/prisma/migrations) is the second line of defense once it lands — keep both, don't
// remove this when the migration arrives.
async function assertNoOverlappingActiveContract(
  employeeId: string,
  startDate: Date,
  endDate: Date | null,
  status: string,
  excludeContractId?: string
) {
  if (status !== "active") return;

  const existingActive = await prisma.contract.findMany({
    where: {
      employeeId,
      status: "active",
      id: excludeContractId ? { not: excludeContractId } : undefined,
    },
  });

  const conflict = existingActive.find((c) => rangesOverlap(startDate, endDate, c.startDate, c.endDate));
  if (conflict) {
    throw ApiError.conflict(
      `contract: overlaps with active contract #${conflict.id} (${conflict.startDate.toISOString().slice(0, 10)} – ${
        conflict.endDate ? conflict.endDate.toISOString().slice(0, 10) : "ongoing"
      })`
    );
  }
}

async function assertEmployeeExists(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw ApiError.badRequest(`employeeId: no employee with id ${employeeId}`);
  }
}

function todayCovered(startDate: Date, endDate: Date | null): boolean {
  const now = new Date();
  return startDate <= now && (endDate === null || endDate >= now);
}

export function listContracts(auth: AuthPayload, filters: { employeeId?: string; status?: string }) {
  const visibilityFilter = isHrmPlus(auth.roles)
    ? {}
    : { employeeId: auth.employeeId ?? "__no_self_employee__" };

  return prisma.contract
    .findMany({
      where: {
        ...visibilityFilter,
        employeeId: filters.employeeId || undefined,
        status: (filters.status as "draft" | "active" | "expired" | "cancelled") || undefined,
      },
      orderBy: { startDate: "desc" },
    })
    .then((contracts) =>
      contracts.map((c) => ({ ...c, isActiveForToday: c.status === "active" && todayCovered(c.startDate, c.endDate) }))
    );
}

export async function getContract(auth: AuthPayload, id: string) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    throw ApiError.notFound(`contract: no contract with id ${id}`);
  }
  if (!isHrmPlus(auth.roles) && contract.employeeId !== auth.employeeId) {
    throw ApiError.forbidden("you may only view your own contracts");
  }
  return { ...contract, isActiveForToday: contract.status === "active" && todayCovered(contract.startDate, contract.endDate) };
}

export async function createContract(input: CreateInput) {
  await assertEmployeeExists(input.employeeId);
  await assertNoOverlappingActiveContract(input.employeeId, input.startDate, input.endDate ?? null, input.status);

  return prisma.contract.create({
    data: {
      employeeId: input.employeeId,
      departmentId: input.departmentId ?? undefined,
      position: input.position ?? undefined,
      wage: input.wage,
      salaryStructureId: input.salaryStructureId ?? undefined,
      startDate: input.startDate,
      endDate: input.endDate ?? undefined,
      status: input.status,
    },
  });
}

export async function updateContract(id: string, input: UpdateInput) {
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(`contract: no contract with id ${id}`);
  }

  const nextStartDate = input.startDate ?? existing.startDate;
  const nextEndDate = input.endDate !== undefined ? input.endDate : existing.endDate;
  const nextStatus = input.status ?? existing.status;

  await assertNoOverlappingActiveContract(existing.employeeId, nextStartDate, nextEndDate, nextStatus, id);

  return prisma.contract.update({
    where: { id },
    data: {
      departmentId: input.departmentId,
      position: input.position,
      wage: input.wage,
      salaryStructureId: input.salaryStructureId,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
    },
  });
}

export async function deleteContract(id: string) {
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(`contract: no contract with id ${id}`);
  }
  const payslipCount = await prisma.payslip.count({ where: { contractId: id } });
  if (payslipCount > 0) {
    throw ApiError.conflict("contract: cannot delete a contract referenced by computed payslips");
  }
  await prisma.contract.delete({ where: { id } });
}
