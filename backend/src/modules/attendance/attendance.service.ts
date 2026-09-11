import { z } from "zod";
import path from "path";
import { AttendanceStatus } from "@prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, isHrmPlus } from "../../middleware/auth";
import {
  checkInSchema,
  checkOutSchema,
  correctAttendanceSchema,
  emergencyCheckoutSchema,
  reviewEmergencySchema,
} from "./attendance.validation";
import { PaginationParams, paginatedResult } from "../../utils/pagination";
import { emailQueue } from "../../queues/email.queue";
import { getZonedClock, normalizeScheduleDay } from "../../utils/timezone";
import { loadSchedulesFor, scheduledHoursForDay, overtimeHoursFor } from "./overtime";

type CheckInInput = z.infer<typeof checkInSchema>;
type CheckOutInput = z.infer<typeof checkOutSchema>;
type CorrectInput = z.infer<typeof correctAttendanceSchema>;
type EmergencyCheckoutInput = z.infer<typeof emergencyCheckoutSchema>;
type ReviewEmergencyInput = z.infer<typeof reviewEmergencySchema>;

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
// overtimeHours is computed here too (see overtime.ts) rather than stored on the
// row, so both the exception flag and the overtime figure come from one enrichment
// pass over the same rows.
async function withException<
  T extends { employeeId: string; checkIn: Date; checkOut: Date | null; status: string; workedHours: unknown }
>(rows: T[]) {
  const scheduleByEmployee = await loadSchedulesFor(rows.map((r) => r.employeeId));
  return rows.map((r) => {
    const lines = scheduleByEmployee.get(r.employeeId) ?? [];
    const overtimeHours = r.checkOut
      ? overtimeHoursFor(Number(r.workedHours), scheduledHoursForDay(lines, r.checkIn))
      : 0;
    return {
      ...r,
      overtimeHours,
      exception:
        r.checkOut === null ? ("missing_checkout" as const) : r.status === "late" ? ("late" as const) : ("none" as const),
    };
  });
}

// ── Shift Window ──────────────────────────────────────────────────────────────
// Convert a "HH:MM" string to total minutes since midnight.
function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

/**
 * Returns the allowed check-in window for today based on the employee's
 * working schedule. Returns null if no schedule / no line for today (unrestricted).
 *
 * Window = (shift start − GRACE_BEFORE_MIN) → (shift start + GRACE_AFTER_MIN)
 * Industry standard: 15 min early, 90 min late (covers most tardy-but-permitted arrivals).
 */
async function getShiftWindowForToday(
  employeeId: string
): Promise<{ openMinutes: number; closeMinutes: number; startTime: string } | null> {
  const GRACE_BEFORE_MIN = 15;
  const GRACE_AFTER_MIN = 90;

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      workingSchedule: { include: { lines: true } },
    },
  });
  if (!employee?.workingSchedule) return null; // no schedule assigned → unrestricted

  const today = getZonedClock().day;
  const line = employee.workingSchedule.lines.find((l) => normalizeScheduleDay(l.day) === today);
  if (!line) return null; // no scheduled work today → unrestricted (day off)

  const startMinutes = timeToMinutes(line.startTime);
  return {
    openMinutes: startMinutes - GRACE_BEFORE_MIN,
    closeMinutes: startMinutes + GRACE_AFTER_MIN,
    startTime: line.startTime,
  };
}

// ── Helpers for authority email resolution ────────────────────────────────────
async function resolveAuthorityEmails(
  employeeId: string
): Promise<{ managerEmail: string | null; hrmEmails: string[] }> {
  // Get the employee with their manager
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      manager: { include: { user: true } },
    },
  });

  const managerEmail = employee?.manager?.user?.email ?? null;

  // All HRM+ users — find via UserRole → Role name in HRM_PLUS set
  const HRM_ROLE_NAMES = ["HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"];
  const hrmUsers = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: { name: { in: HRM_ROLE_NAMES } },
          effectiveTo: null, // only active assignments
        },
      },
    },
    select: { email: true },
  });

  const hrmEmails = hrmUsers.map((u) => u.email).filter((e): e is string => !!e);

  return { managerEmail, hrmEmails };
}


// ── List Attendance ───────────────────────────────────────────────────────────
// Pagination is opt-in — see employee.service.ts for the same pattern and why.
export async function listAttendance(
  auth: AuthPayload,
  filters: { employeeId?: string; dateFrom?: Date; dateTo?: Date; status?: string },
  pagination?: PaginationParams
) {
  // employeeId is built exactly once, here — a non-HRM+ caller is always locked to
  // their own employeeId regardless of filters.employeeId (a duplicate key further
  // down used to silently overwrite this restriction on every unfiltered request).
  const where = {
    employeeId: isHrmPlus(auth.roles) ? filters.employeeId || undefined : auth.employeeId ?? "__no_self_employee__",
    status: filters.status ? (filters.status as AttendanceStatus) : undefined,
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
    return await withException(rows);
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
  return paginatedResult(await withException(rows), total, pagination);
}

// ── Check In ─────────────────────────────────────────────────────────────────
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

  // Shift window enforcement — HRM+ are exempt (they can back-fill for employees).
  if (!isHrmPlus(auth.roles)) {
    const window = await getShiftWindowForToday(input.employeeId);
    if (window) {
      const nowMinutes = getZonedClock().minutes;
      if (nowMinutes < window.openMinutes || nowMinutes > window.closeMinutes) {
        const fmt = (m: number) =>
          `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        throw ApiError.forbidden(
          `attendance: check-in is only allowed between ${fmt(window.openMinutes)} and ${fmt(window.closeMinutes)} (shift starts at ${window.startTime})`
        );
      }
    }
  }

  // Always server time — see attendance.validation.ts for why a client-supplied
  // timestamp is never trusted here.
  const checkInTime = new Date();
  return prisma.attendance.create({
    data: { employeeId: input.employeeId, checkIn: checkInTime, workedHours: 0, status: "present" },
  });
}

// ── Check Out (normal) ────────────────────────────────────────────────────────
export async function checkOut(auth: AuthPayload, id: string, input: CheckOutInput) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound(`attendance: no attendance record with id ${id}`);
  }
  assertSelfOrHrmPlus(auth, existing.employeeId);

  // Always server time — see attendance.validation.ts for why a client-supplied
  // timestamp is never trusted here.
  const checkOutTime = new Date();
  if (checkOutTime <= existing.checkIn) {
    throw ApiError.badRequest("checkOut: must be after checkIn");
  }

  return prisma.attendance.update({
    where: { id },
    data: { checkOut: checkOutTime, workedHours: computeWorkedHours(existing.checkIn, checkOutTime) },
  });
}

// ── Emergency Checkout ────────────────────────────────────────────────────────
export async function emergencyCheckout(
  auth: AuthPayload,
  attendanceId: string,
  input: EmergencyCheckoutInput,
  evidenceFile?: Express.Multer.File
) {
  const existing = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { employee: { include: { user: true } } },
  });
  if (!existing) throw ApiError.notFound(`attendance: no record with id ${attendanceId}`);
  if (existing.checkOut) throw ApiError.conflict("attendance: already checked out");
  assertSelfOrHrmPlus(auth, existing.employeeId);

  const checkOutTime = new Date();
  const evidencePath = evidenceFile
    ? path.join("uploads", "evidence", evidenceFile.filename)
    : null;

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      checkOut: checkOutTime,
      workedHours: computeWorkedHours(existing.checkIn, checkOutTime),
      status: "emergency_checkout",
      emergencyReason: input.reason,
      evidencePath: evidencePath ?? undefined,
      emergencyStatus: "pending",
    },
    include: { employee: { select: { name: true } } },
  });

  // ── Fire notifications ─────────────────────────────────────────────────────
  const { managerEmail, hrmEmails } = await resolveAuthorityEmails(existing.employeeId);

  const employeeName = existing.employee?.name ?? "An employee";
  const subject = `🚨 Emergency Checkout Alert — ${employeeName}`;
  const body = `
${employeeName} has performed an EMERGENCY CHECKOUT at ${checkOutTime.toLocaleString()}.

Reason: ${input.reason.toUpperCase()}
Attendance Record: #${attendanceId}
Evidence Uploaded: ${evidencePath ? "Yes" : "No"}

Please review this in the HR portal under Attendance → Emergency Review.
This record is currently pending your approval or rejection.
`.trim();

  const recipients = [...new Set([...(managerEmail ? [managerEmail] : []), ...hrmEmails])];
  await Promise.all(
    recipients.map((to) =>
      emailQueue.add("emergency-checkout-alert", { to, subject, text: body })
    )
  );

  return updated;
}

// ── List Emergency Checkouts (HRM+ only) ──────────────────────────────────────
export async function listEmergencies(auth: AuthPayload) {
  if (!isHrmPlus(auth.roles)) {
    throw ApiError.forbidden("listEmergencies: requires HRM+ role");
  }
  return prisma.attendance.findMany({
    where: { status: "emergency_checkout" },
    orderBy: { checkIn: "desc" },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          jobPosition: true,
          manager: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
    },
  });
}

// ── Review Emergency (HRM+ only) ──────────────────────────────────────────────
export async function reviewEmergency(auth: AuthPayload, attendanceId: string, input: ReviewEmergencyInput) {
  if (!isHrmPlus(auth.roles)) {
    throw ApiError.forbidden("reviewEmergency: requires HRM+ role");
  }

  const existing = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: { employee: { include: { user: true } } },
  });
  if (!existing) throw ApiError.notFound(`attendance: no record with id ${attendanceId}`);
  if (existing.status !== "emergency_checkout") {
    throw ApiError.badRequest("attendance: record is not an emergency checkout");
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: { emergencyStatus: input.action },
    include: { employee: { select: { name: true } } },
  });

  // Notify the employee about the decision
  const employeeEmail = existing.employee?.user?.email;
  if (employeeEmail) {
    const statusLabel = input.action === "approved" ? "APPROVED ✅" : "REJECTED ❌";
    const subject = `Emergency Checkout ${statusLabel}`;
    const body = `
Your emergency checkout request (Record #${attendanceId}) has been ${input.action.toUpperCase()} by HR.

${input.note ? `HR Note: ${input.note}` : ""}

If you have questions, please contact your HR department.
`.trim();

    await emailQueue.add("emergency-review-result", {
      to: employeeEmail,
      subject,
      text: body,
    });
  }

  return updated;
}

// ── Correct Attendance (HRM+ only) ────────────────────────────────────────────
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

// ── Get Shift Window (for frontend UI) ────────────────────────────────────────
// Returns the shift window for a given employee today — used by the frontend to
// show/hide the check-in button without waiting for a rejected API call.
export async function getShiftWindow(auth: AuthPayload, employeeId: string) {
  assertSelfOrHrmPlus(auth, employeeId);
  const window = await getShiftWindowForToday(employeeId);
  if (!window) return { restricted: false };
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return {
    restricted: true,
    openTime: fmt(window.openMinutes),
    closeTime: fmt(window.closeMinutes),
    shiftStart: window.startTime,
  };
}
