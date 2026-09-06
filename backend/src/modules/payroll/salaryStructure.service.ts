import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
} from "./salaryStructure.validation";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

type CreateStructureInput = z.infer<typeof createSalaryStructureSchema>;
type UpdateStructureInput = z.infer<typeof updateSalaryStructureSchema>;
type CreateRuleInput = z.infer<typeof createSalaryRuleSchema>;
type UpdateRuleInput = z.infer<typeof updateSalaryRuleSchema>;

export async function listStructures(pagination?: PaginationParams) {
  const include = { _count: { select: { rules: true, contracts: true } } };
  const orderBy = { name: "asc" as const };
  
  if (!pagination) {
    const structures = await prisma.salaryStructure.findMany({ include, orderBy });
    return structures.map((s) => ({
      ...s,
      ruleCount: s._count.rules,
      employeeCount: s._count.contracts,
    }));
  }

  const [items, total] = await Promise.all([
    prisma.salaryStructure.findMany({ include, orderBy, skip: pagination.skip, take: pagination.take }),
    prisma.salaryStructure.count()
  ]);
  
  const mappedItems = items.map((s) => ({
    ...s,
    ruleCount: s._count.rules,
    employeeCount: s._count.contracts,
  }));
  
  return paginatedResult(mappedItems, total, pagination);
}

export async function getStructure(id: string) {
  const structure = await prisma.salaryStructure.findUnique({ where: { id } });
  if (!structure) throw ApiError.notFound(`salaryStructure: no structure with id ${id}`);
  return structure;
}

export function createStructure(input: CreateStructureInput) {
  return prisma.salaryStructure.create({ data: input });
}

export async function updateStructure(id: string, input: UpdateStructureInput) {
  await getStructure(id);
  return prisma.salaryStructure.update({ where: { id }, data: input });
}

export async function listRules(structureId: string, pagination?: PaginationParams) {
  if (!pagination) {
    return prisma.salaryRule.findMany({ where: { structureId }, orderBy: { sequence: "asc" } });
  }
  
  const [items, total] = await Promise.all([
    prisma.salaryRule.findMany({ where: { structureId }, orderBy: { sequence: "asc" }, skip: pagination.skip, take: pagination.take }),
    prisma.salaryRule.count({ where: { structureId } })
  ]);
  
  return paginatedResult(items, total, pagination);
}

function assertComputationInputsMakeSense(input: { computationMethod: string; fixedAmount?: number | null; percentage?: number | null; formula?: string | null }) {
  if (input.computationMethod === "fixed" && (input.fixedAmount === null || input.fixedAmount === undefined)) {
    throw ApiError.badRequest("fixedAmount: required when computationMethod is 'fixed'");
  }
  if (input.computationMethod === "percentage" && (input.percentage === null || input.percentage === undefined)) {
    throw ApiError.badRequest("percentage: required when computationMethod is 'percentage'");
  }
  if (input.computationMethod === "formula" && !input.formula) {
    throw ApiError.badRequest("formula: required when computationMethod is 'formula'");
  }
}

export async function createRule(input: CreateRuleInput) {
  assertComputationInputsMakeSense(input);

  const existingSequence = await prisma.salaryRule.findFirst({
    where: { structureId: input.structureId, sequence: input.sequence },
  });
  if (existingSequence) {
    throw ApiError.conflict(
      `sequence: ${input.sequence} is already used by rule '${existingSequence.name}' in this structure`
    );
  }

  return prisma.salaryRule.create({ data: input });
}

export async function updateRule(id: string, input: UpdateRuleInput) {
  const existing = await prisma.salaryRule.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound(`salaryRule: no rule with id ${id}`);

  assertComputationInputsMakeSense({
    computationMethod: input.computationMethod ?? existing.computationMethod,
    fixedAmount: input.fixedAmount ?? Number(existing.fixedAmount ?? 0),
    percentage: input.percentage ?? Number(existing.percentage ?? 0),
    formula: input.formula ?? existing.formula,
  });

  if (input.sequence !== undefined && input.sequence !== existing.sequence) {
    const clash = await prisma.salaryRule.findFirst({
      where: { structureId: existing.structureId, sequence: input.sequence, id: { not: id } },
    });
    if (clash) {
      throw ApiError.conflict(`sequence: ${input.sequence} is already used by rule '${clash.name}' in this structure`);
    }
  }

  return prisma.salaryRule.update({ where: { id }, data: input });
}
