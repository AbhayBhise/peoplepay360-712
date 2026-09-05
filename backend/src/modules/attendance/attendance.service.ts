import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { checkInSchema, checkOutSchema, correctAttendanceSchema } from "./attendance.validation";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

type CheckInInput = z.infer<typeof checkInSchema>;
type CheckOutInput = z.infer<typeof checkOutSchema>;
type CorrectInput = z.infer<typeof correctAttendanceSchema>;

// worked_hours is always computed from check_in/check_out — docs/01_DATABASE_SCHEMA.md.
// Never accept it as input anywhere in this module.
function computeWorkedHours(checkIn: Date, checkOut: Date | null): number {
  if (!checkOut) return 0;
  const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
  return Math.round(Math.max(hours, 0) * 100) / 100;
}

function assertSelfOrHrmPlus(auth: AuthPayload, employeeId: string) {
  if (!isHrmPlus(auth.roles) && auth.employeeId !== employeeId) {
    throw ApiError.forbidden("you may only manage your own attendance");
  }
}

// docs/02_API_CONTRACTS.md section 5: exception is missing_checkout|late|none —
// missing_checkout takes priority since it's the more actionable of the two.
function withException<T extends { checkOut: Date | null; status: string }>(rows: T[]) {
  return rows.map((r) => ({
    ...r,
    exception:
      r.checkOut === null ? ("missing_checkout" as const) : r.status === "late" ? ("late" as const) : ("none" as const),
  }));
}

// Pagination is opt-in — see employee.service.ts for the same pattern and why.
export async function listAttendance(
  auth: AuthPayload,
  filters: { employeeId?: string; dateFrom?: Date; dateTo?: Date; status?: string },
  pagination?: PaginationParams
) {
  const where = {
    ...(isHrmPlus(auth.roles) ? {} : { employeeId: auth.employeeId ?? "__no_self_employee__" }),
    employeeId: filters.employeeId || undefined,
    status: (filters.status as "present" | "late" | "absent" | "manual_edit") || undefined,
    checkIn:
      filters.dateFrom || filters.dateTo ? { gte: filters.dateFrom, lte: filters.dateTo } : undefined,
  };

  // Every list endpoint that shows a name (not just an employeeId) has to include the
  // relation explicitly — Prisma never joins it for you. Missing here is exactly what
  // produced "Employee #undefined" on the Attendance screen: the row existed, the
  // employee's name was simply never fetched.
  const employeeSelect = { employee: { select: { id: true, name: true } } } as const;

  if (!pagination) {
    const rows = await prisma.attendance.findMany({ where, orderBy: { checkIn: "desc" }, include: employeeSelect });
    return withException(rows);
  }

  const [rows, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      orderBy: { checkIn: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: employeeSelect,
    }),
    prisma.attendance.count({ where }),
  ]);
  return paginatedResult(withException(rows), total, pagination);
}

export async function checkIn(auth: AuthPayload, input: CheckInInput) {
  assertSelfOrHrmPlus(auth, input.employeeId);

  const openEntry = await prisma.attendance.findFirst({
    where: { employeeId: input.employeeId, checkOut: null },
  });
  if (openEntry) {
    throw ApiError.conflict(
      `attendance: employee already has an open check-in (#${openEntry.id}) — check out first`
    );
  }

  const checkInTime = input.checkIn ?? new Date();
  return prisma.attendance.create({
    data: { employeeId: input.employeeId, checkIn: checkInTime, workedHours: 0, status: "present" },
  });
}

export async function checkOut(auth: AuthPayload, id: string, input: CheckOutInput) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(`attendance: no attendance record with id ${id}`);
  }
  assertSelfOrHrmPlus(auth, existing.employeeId);

  const checkOutTime = input.checkOut ?? new Date();
  if (checkOutTime <= existing.checkIn) {
    throw ApiError.badRequest("checkOut: must be after checkIn");
  }
  if (checkOutTime > new Date()) {
    throw ApiError.badRequest("checkOut: cannot be in the future");
  }

  return prisma.attendance.update({
    where: { id },
    data: { checkOut: checkOutTime, workedHours: computeWorkedHours(existing.checkIn, checkOutTime) },
  });
}

// Corrections restricted to HRM+ at the route layer — plain employees can only
// create today's check-in/out, never edit past records (docs/roles/FRONTEND.md).
export async function correctAttendance(id: string, input: CorrectInput) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(`attendance: no attendance record with id ${id}`);
  }

  const nextCheckIn = input.checkIn ?? existing.checkIn;
  const nextCheckOut = input.checkOut !== undefined ? input.checkOut : existing.checkOut;

  if (nextCheckOut && nextCheckOut <= nextCheckIn) {
    throw ApiError.badRequest("checkOut: must be after checkIn");
  }

  return prisma.attendance.update({
    where: { id },
    data: {
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
      workedHours: computeWorkedHours(nextCheckIn, nextCheckOut ?? null),
      status: input.status ?? "manual_edit",
    },
  });
}
