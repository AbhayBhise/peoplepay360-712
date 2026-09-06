import { z } from "zod";

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, { message: "is required" }).max(120),
  unit: z.enum(["days", "hours"]).default("days"),
  requiresAllocation: z.boolean().default(true),
  payrollIntegration: z.boolean().default(true),
});
export const updateTimeOffTypeSchema = createTimeOffTypeSchema.partial();

export const createAllocationSchema = z.object({
  employeeId: z.string().min(1, { message: "is required" }),
  typeId: z.string().min(1, { message: "is required" }),
  allocated: z.number().positive({ message: "must be greater than 0" }),
  validFrom: z.coerce.date().optional(),
  validTo: z.coerce.date().optional().nullable(),
});

export const createRequestSchema = z
  .object({
    employeeId: z.string().min(1, { message: "is required" }),
    typeId: z.string().min(1, { message: "is required" }),
    dateFrom: z.coerce.date(),
    dateTo: z.coerce.date(),
  })
  .refine((r) => r.dateTo >= r.dateFrom, { message: "must be on/after dateFrom", path: ["dateTo"] });
