import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(1, { message: "is required" }).max(120),
  email: z.string().email().optional().nullable(),
  departmentId: z.string().min(1).optional().nullable(),
  managerId: z.string().min(1).optional().nullable(),
  jobPosition: z.string().max(120).optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  workingScheduleId: z.string().min(1).optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.omit({ email: true }).partial();
