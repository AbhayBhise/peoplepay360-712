import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import { checkInSchema, checkOutSchema, correctAttendanceSchema } from "./attendance.validation";

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

export function listAttendance(
  auth: AuthPayload,
  filters: { employeeId?: string; dateFrom?: Date; dateTo?: Date; status?: string }
) {
  const visibilityFilter = isHrmPlus(auth.roles)
    ? {}
    : { employeeId: auth.employeeId ?? "__no_self_employee__" };

  return prisma.attendance
    .findMany({
      where: {
        ...visibilityFilter,
        employeeId: filters.employeeId || undefined,
        status: (filters.status as "present" | "late" | "absent" | "manual_edit") || undefined,
        checkIn:
          filters.dateFrom || filters.dateTo
            ? { gte: filters.dateFrom, lte: filters.dateTo }
            : undefined,
      },
      orderBy: { checkIn: "desc" },
    })
    .then((rows) =>
      rows.map((r) => ({
        ...r,
        exception: r.checkOut === null ? ("missing_checkout" as const) : ("none" as const),
      }))
    );
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
