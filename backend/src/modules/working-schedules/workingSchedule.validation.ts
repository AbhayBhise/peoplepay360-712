import { z } from "zod";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleLineSchema = z
  .object({
    day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    startTime: z.string().regex(TIME_RE, { message: "must be HH:MM (24h)" }),
    endTime: z.string().regex(TIME_RE, { message: "must be HH:MM (24h)" }),
    breakMins: z.number().int().min(0).max(480).default(0),
  })
  .refine((line) => toMinutes(line.endTime) > toMinutes(line.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const createWorkingScheduleSchema = z.object({
  name: z.string().min(1, { message: "is required" }).max(120),
  type: z.string().min(1, { message: "is required" }).max(60),
  lines: z.array(scheduleLineSchema).min(1, { message: "at least one schedule line is required" }),
});

export const updateWorkingScheduleSchema = createWorkingScheduleSchema.partial({ name: true, type: true }).extend({
  lines: createWorkingScheduleSchema.shape.lines.optional(),
});

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
