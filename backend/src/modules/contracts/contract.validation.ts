import { z } from "zod";

export const createContractSchema = z
  .object({
    employeeId: z.string().min(1, { message: "is required" }),
    departmentId: z.string().min(1).optional().nullable(),
    position: z.string().max(120).optional().nullable(),
    wage: z.number().positive({ message: "must be greater than 0" }),
    salaryStructureId: z.string().min(1).optional().nullable(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional().nullable(),
    status: z.enum(["draft", "active", "expired", "cancelled"]).default("draft"),
  })
  .refine((c) => !c.endDate || c.endDate > c.startDate, {
    message: "must be after startDate",
    path: ["endDate"],
  });

export const updateContractSchema = z
  .object({
    departmentId: z.string().min(1).optional().nullable(),
    position: z.string().max(120).optional().nullable(),
    wage: z.number().positive({ message: "must be greater than 0" }).optional(),
    salaryStructureId: z.string().min(1).optional().nullable(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional().nullable(),
    status: z.enum(["draft", "active", "expired", "cancelled"]).optional(),
  })
  .refine((c) => !c.startDate || !c.endDate || c.endDate > c.startDate, {
    message: "must be after startDate",
    path: ["endDate"],
  });
