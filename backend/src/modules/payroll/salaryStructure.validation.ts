import { z } from "zod";

export const createSalaryStructureSchema = z.object({
  name: z.string().min(1, { message: "is required" }).max(120),
  active: z.boolean().default(true),
});
export const updateSalaryStructureSchema = createSalaryStructureSchema.partial();

export const createSalaryRuleSchema = z.object({
  structureId: z.string().min(1, { message: "is required" }),
  name: z.string().min(1, { message: "is required" }).max(120),
  code: z.string().min(1, { message: "is required" }).max(40),
  category: z.enum(["basic", "allowance", "gross", "deduction", "net"]),
  sequence: z.number().int().min(0),
  computationMethod: z.enum(["fixed", "percentage", "formula"]),
  fixedAmount: z.number().optional().nullable(),
  percentage: z.number().optional().nullable(),
  baseField: z.string().max(40).optional().nullable(),
  formula: z.string().max(500).optional().nullable(),
});
export const updateSalaryRuleSchema = createSalaryRuleSchema.partial().omit({ structureId: true });
