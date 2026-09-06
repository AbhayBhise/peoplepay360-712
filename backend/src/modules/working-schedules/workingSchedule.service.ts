import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import {
  createWorkingScheduleSchema,
  updateWorkingScheduleSchema,
  toMinutes,
} from "./workingSchedule.validation";

type CreateInput = z.infer<typeof createWorkingScheduleSchema>;
type UpdateInput = z.infer<typeof updateWorkingScheduleSchema>;

// docs/01_DATABASE_SCHEMA.md: weekly_hours is derived from schedule_lines, never entered
// manually — this is the one place that computation happens, called on every write.
function computeWeeklyHours(lines: { startTime: string; endTime: string; breakMins: number }[]): number {
  const totalMinutes = lines.reduce((sum, line) => {
    const minutes = toMinutes(line.endTime) - toMinutes(line.startTime) - line.breakMins;
    return sum + Math.max(minutes, 0);
  }, 0);
  return Math.round((totalMinutes / 60) * 100) / 100;
}

export async function listWorkingSchedules(pagination?: import("../../utils/pagination").PaginationParams) {
  if (!pagination) {
    return prisma.workingSchedule.findMany({
      include: { lines: true },
      orderBy: { name: "asc" },
    });
  }
  const [items, total] = await Promise.all([
    prisma.workingSchedule.findMany({
      include: { lines: true },
      orderBy: { name: "asc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.workingSchedule.count(),
  ]);
  const { paginatedResult } = await import("../../utils/pagination");
  return paginatedResult(items, total, pagination);
}

export async function getWorkingSchedule(id: string) {
  const schedule = await prisma.workingSchedule.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!schedule) {
    throw ApiError.notFound(`workingSchedule: no working schedule with id ${id}`);
  }
  return schedule;
}

export async function createWorkingSchedule(input: CreateInput) {
  const weeklyHours = computeWeeklyHours(input.lines);

  return prisma.workingSchedule.create({
    data: {
      name: input.name,
      type: input.type,
      weeklyHours,
      lines: {
        create: input.lines.map((line) => ({
          day: line.day,
          startTime: line.startTime,
          endTime: line.endTime,
          breakMins: line.breakMins,
        })),
      },
    },
    include: { lines: true },
  });
}

export async function updateWorkingSchedule(id: string, input: UpdateInput) {
  const existing = await prisma.workingSchedule.findUnique({ where: { id }, include: { lines: true } });
  if (!existing) {
    throw ApiError.notFound(`workingSchedule: no working schedule with id ${id}`);
  }

  const lines = input.lines ?? existing.lines.map((l) => ({
    day: l.day as "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
    startTime: l.startTime,
    endTime: l.endTime,
    breakMins: l.breakMins,
  }));
  const weeklyHours = computeWeeklyHours(lines);

  return prisma.$transaction(async (tx) => {
    if (input.lines) {
      await tx.scheduleLine.deleteMany({ where: { scheduleId: id } });
    }
    return tx.workingSchedule.update({
      where: { id },
      data: {
        name: input.name,
        type: input.type,
        weeklyHours,
        lines: input.lines
          ? {
              create: input.lines.map((line) => ({
                day: line.day,
                startTime: line.startTime,
                endTime: line.endTime,
                breakMins: line.breakMins,
              })),
            }
          : undefined,
      },
      include: { lines: true },
    });
  });
}

export async function deleteWorkingSchedule(id: string) {
  const inUse = await prisma.employee.count({ where: { workingScheduleId: id } });
  if (inUse > 0) {
    throw ApiError.conflict("workingSchedule: cannot delete a schedule assigned to employees");
  }
  await prisma.workingSchedule.delete({ where: { id } });
}
