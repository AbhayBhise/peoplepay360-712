import { z } from "zod";

export const previewPayrunSchema = z
  .object({
    structureId: z.string().min(1, { message: "is required" }),
    periodStart: z.coerce.date(),
    periodEnd: z.coerce.date(),
  })
  .refine((p) => p.periodEnd > p.periodStart, { message: "must be after periodStart", path: ["periodEnd"] });

export const createPayrunSchema = previewPayrunSchema.and(
  z.object({
    employeeIds: z.array(z.string().min(1)).min(1, { message: "select at least one employee" }),
  })
);
