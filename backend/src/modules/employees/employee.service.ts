import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.validation";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

type CreateInput = z.infer<typeof createEmployeeSchema>;
type UpdateInput = z.infer<typeof updateEmployeeSchema>;

interface ListFilters {
  departmentId?: string;
  status?: string;
  search?: string;
}

// docs/02_API_CONTRACTS.md section 2: HRM+ sees everyone, Employee sees only self.
// This is the Data layer of RBAC (docs/roles/ARCHITECT.md) — enforced here, server-side,
// not left to the frontend to "just not ask" for other employees' records.
//
// Pagination is opt-in: pass `pagination` to get a { items, page, limit, total, totalPages }
// envelope; omit it to get the full list back exactly as before (kept for backward
// compatibility with existing frontend call sites that don't send page/limit yet).
export async function listEmployees(auth: AuthPayload, filters: ListFilters, pagination?: PaginationParams) {
  const where = {
    ...(isHrmPlus(auth.roles) ? {} : { id: auth.employeeId ?? "__no_self_employee__" }),
    departmentId: filters.departmentId || undefined,
    status: (filters.status as "active" | "inactive") || undefined,
    name: filters.search ? { contains: filters.search, mode: "insensitive" as const } : undefined,
  };
  const include = { department: true, manager: true, workingSchedule: true };

  if (!pagination) {
    return prisma.employee.findMany({ where, orderBy: { name: "asc" }, include });
  }

  const [items, total] = await Promise.all([
    prisma.employee.findMany({ where, orderBy: { name: "asc" }, include, skip: pagination.skip, take: pagination.take }),
    prisma.employee.count({ where }),
  ]);
  return paginatedResult(items, total, pagination);
}

function assertCanView(auth: AuthPayload, employeeId: string) {
  if (isHrmPlus(auth.roles)) return;
  if (auth.employeeId !== employeeId) {
    throw ApiError.forbidden("you may only view your own employee record");
  }
}

export async function getEmployeeById(auth: AuthPayload, id: string) {
  assertCanView(auth, id);

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { department: true, manager: true, workingSchedule: true },
  });
  if (!employee) {
    throw ApiError.notFound(`employee: no employee with id ${id}`);
  }

  const [contractsCount, attendanceCount, timeOffCount, payslipsCount] = await Promise.all([
    prisma.contract.count({ where: { employeeId: id } }),
    prisma.attendance.count({ where: { employeeId: id } }),
    prisma.timeOffRequest.count({ where: { employeeId: id } }),
    prisma.payslip.count({ where: { employeeId: id } }),
  ]);

  return {
    ...employee,
    contractsCount,
    attendanceCount,
    timeOffCount,
    payslipsCount,
  };
}

async function assertDepartmentExists(departmentId: string | null | undefined) {
  if (!departmentId) return;
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) {
    throw ApiError.badRequest(`departmentId: no department with id ${departmentId}`);
  }
}

async function assertManagerIsDifferentEmployee(
  employeeId: string | undefined,
  managerId: string | null | undefined
) {
  if (!managerId) return;
  if (employeeId && managerId === employeeId) {
    throw ApiError.badRequest("managerId: an employee cannot be their own manager");
  }
  const manager = await prisma.employee.findUnique({ where: { id: managerId } });
  if (!manager) {
    throw ApiError.badRequest(`managerId: no employee with id ${managerId}`);
  }
}

export async function createEmployee(input: CreateInput) {
  await assertDepartmentExists(input.departmentId);
  await assertManagerIsDifferentEmployee(undefined, input.managerId);

  return prisma.employee.create({
    data: {
      name: input.name,
      departmentId: input.departmentId ?? undefined,
      managerId: input.managerId ?? undefined,
      jobPosition: input.jobPosition ?? undefined,
      status: input.status,
      workingScheduleId: input.workingScheduleId ?? undefined,
    },
  });
}

export async function updateEmployee(id: string, input: UpdateInput) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(`employee: no employee with id ${id}`);
  }

  await assertDepartmentExists(input.departmentId);
  await assertManagerIsDifferentEmployee(id, input.managerId);

  return prisma.employee.update({
    where: { id },
    data: {
      name: input.name,
      departmentId: input.departmentId,
      managerId: input.managerId,
      jobPosition: input.jobPosition,
      status: input.status,
      workingScheduleId: input.workingScheduleId,
    },
  });
}

// Soft delete only — payroll/attendance history must survive (docs/01_DATABASE_SCHEMA.md).
export async function deactivateEmployee(id: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(`employee: no employee with id ${id}`);
  }
  return prisma.employee.update({ where: { id }, data: { status: "inactive" } });
}

export async function getRelatedContracts(auth: AuthPayload, employeeId: string) {
  assertCanView(auth, employeeId);
  return prisma.contract.findMany({ where: { employeeId }, orderBy: { startDate: "desc" } });
}

export async function getRelatedAttendance(auth: AuthPayload, employeeId: string) {
  assertCanView(auth, employeeId);
  return prisma.attendance.findMany({ where: { employeeId }, orderBy: { checkIn: "desc" } });
}

export async function getRelatedTimeOff(auth: AuthPayload, employeeId: string) {
  assertCanView(auth, employeeId);
  return prisma.timeOffRequest.findMany({ where: { employeeId }, orderBy: { dateFrom: "desc" } });
}

export async function getRelatedPayslips(auth: AuthPayload, employeeId: string) {
  assertCanView(auth, employeeId);
  return prisma.payslip.findMany({ where: { employeeId }, orderBy: { createdAt: "desc" } });
}
