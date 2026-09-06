import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { createTimeOffTypeSchema, updateTimeOffTypeSchema } from "./timeOff.validation";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

type CreateInput = z.infer<typeof createTimeOffTypeSchema>;
type UpdateInput = z.infer<typeof updateTimeOffTypeSchema>;

export async function listTypes(pagination?: PaginationParams) {
  if (!pagination) {
    return prisma.timeOffType.findMany({ orderBy: { name: "asc" } });
  }
  const [items, total] = await Promise.all([
    prisma.timeOffType.findMany({ orderBy: { name: "asc" }, skip: pagination.skip, take: pagination.take }),
    prisma.timeOffType.count(),
  ]);
  return paginatedResult(items, total, pagination);
}

export async function getType(id: string) {
  const type = await prisma.timeOffType.findUnique({ where: { id } });
  if (!type) throw ApiError.notFound(`timeOffType: no time off type with id ${id}`);
  return type;
}

export function createType(input: CreateInput) {
  return prisma.timeOffType.create({ data: input });
}

export async function updateType(id: string, input: UpdateInput) {
  await getType(id);
  return prisma.timeOffType.update({ where: { id }, data: input });
}
