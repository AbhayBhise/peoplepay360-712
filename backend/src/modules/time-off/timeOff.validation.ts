import { z } from "zod";

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, { message: "is required" }).max(120),
  unit: z.enum(["days", "hours"]).default("days"),
  requiresAllocation: z.boolean().default(true),
  payrollIntegration: z.boolean().default(true),
  requiresCertificate: z.boolean().default(false),
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
    requestUnit: z.enum(["full_day", "half_day"]).default("full_day"),
    requestUnitHalf: z.enum(["morning", "afternoon"]).optional().nullable(),
  })
  .refine((r) => r.dateTo >= r.dateFrom, { message: "must be on/after dateFrom", path: ["dateTo"] })
  .refine((r) => r.requestUnit === "full_day" || (r.requestUnit === "half_day" && r.requestUnitHalf), {
    message: "Half day requests must specify morning or afternoon",
    path: ["requestUnitHalf"],
  });

export const updateRequestSchema = z
  .object({
    typeId: z.string().min(1, { message: "is required" }).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    requestUnit: z.enum(["full_day", "half_day"]).optional(),
    requestUnitHalf: z.enum(["morning", "afternoon"]).optional().nullable(),
  })
  .refine((r) => !r.dateFrom || !r.dateTo || r.dateTo >= r.dateFrom, { message: "must be on/after dateFrom", path: ["dateTo"] })
  .refine((r) => !r.requestUnit || r.requestUnit === "full_day" || (r.requestUnit === "half_day" && r.requestUnitHalf), {
    message: "Half day requests must specify morning or afternoon",
    path: ["requestUnitHalf"],
  });

