import { prisma } from "../../prisma";
import { getZonedClock, normalizeScheduleDay } from "../../utils/timezone";

interface ScheduleLine {
  day: string;
  startTime: string;
  endTime: string;
  breakMins: number;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

// Overtime policy: any hours worked beyond what an employee's assigned Working
// Schedule allots for that exact weekday count as overtime — including the entire
// shift on a day with no scheduled line at all (a day off worked in full). This is
// derived from Attendance.workedHours + WorkingSchedule at read time rather than
// stored on the row, so it can never drift out of sync if a schedule changes later,
// and it needs no migration — the same pattern listAttendance already uses for the
// "late" / "missing_checkout" exception flags.
export function scheduledHoursForDay(lines: ScheduleLine[], checkIn: Date): number {
  const day = getZonedClock(checkIn).day;
  const line = lines.find((l) => normalizeScheduleDay(l.day) === day);
  if (!line) return 0;
  const minutes = timeToMinutes(line.endTime) - timeToMinutes(line.startTime) - line.breakMins;
  return Math.max(0, minutes) / 60;
}

export function overtimeHoursFor(workedHours: number, scheduledHours: number): number {
  return Math.round(Math.max(0, workedHours - scheduledHours) * 100) / 100;
}

// Batch-loads each employee's assigned schedule once per call regardless of how many
// attendance rows reference the same employee — avoids an N+1 query when enriching a
// list of attendance rows or a dashboard aggregate.
export async function loadSchedulesFor(employeeIds: string[]): Promise<Map<string, ScheduleLine[]>> {
  const uniqueIds = [...new Set(employeeIds)];
  if (!uniqueIds.length) return new Map();
  const employees = await prisma.employee.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, workingSchedule: { select: { lines: true } } },
  });
  return new Map(employees.map((e) => [e.id, e.workingSchedule?.lines ?? []]));
}
