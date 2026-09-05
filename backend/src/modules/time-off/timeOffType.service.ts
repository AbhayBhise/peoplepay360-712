import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { createTimeOffTypeSchema, updateTimeOffTypeSchema } from "./timeOff.validation";

type CreateInput = z.infer<typeof createTimeOffTypeSchema>;
type UpdateInput = z.infer<typeof updateTimeOffTypeSchema>;

export function listTypes() {
  return prisma.timeOffType.findMany({ orderBy: { name: "asc" } });
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
