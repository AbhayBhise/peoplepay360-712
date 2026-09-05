import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, { message: "is required" }).max(120),
  parentDepartmentId: z.string().min(1).optional().nullable(),
  headEmployeeId: z.string().min(1).optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();
