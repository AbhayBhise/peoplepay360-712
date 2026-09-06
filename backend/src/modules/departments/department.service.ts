import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { z } from "zod";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.validation";

type CreateInput = z.infer<typeof createDepartmentSchema>;
type UpdateInput = z.infer<typeof updateDepartmentSchema>;

export async function listDepartments(parentId?: string, pagination?: import("../../utils/pagination").PaginationParams) {
  // No pagination here — departments are a small, bounded reference list, never
  // thousands of rows — but the parent/head names still need the same include every
  // other list endpoint needed to avoid showing a raw id instead of a name.
  const where = parentId ? { parentDepartmentId: parentId } : undefined;
  if (!pagination) {
    return prisma.department.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        parentDepartment: { select: { id: true, name: true } },
        headEmployee: { select: { id: true, name: true } },
      },
    });
  }
  const [items, total] = await Promise.all([
    prisma.department.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        parentDepartment: { select: { id: true, name: true } },
        headEmployee: { select: { id: true, name: true } },
      },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.department.count({ where }),
  ]);
  const { paginatedResult } = await import("../../utils/pagination");
  return paginatedResult(items, total, pagination);
}

export async function getDepartment(id: string) {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) {
    throw ApiError.notFound(`department: no department with id ${id}`);
  }
  return department;
}

async function assertNotSelfParent(id: string | undefined, parentDepartmentId: string | null | undefined) {
  if (id && parentDepartmentId && id === parentDepartmentId) {
    throw ApiError.badRequest("parentDepartmentId: a department cannot be its own parent");
  }
}

export async function createDepartment(input: CreateInput) {
  await assertNotSelfParent(undefined, input.parentDepartmentId);
  return prisma.department.create({ data: input });
}

export async function updateDepartment(id: string, input: UpdateInput) {
  await getDepartment(id);
  await assertNotSelfParent(id, input.parentDepartmentId);
  return prisma.department.update({ where: { id }, data: input });
}

export async function deleteDepartment(id: string) {
  await getDepartment(id);
  const employeeCount = await prisma.employee.count({ where: { departmentId: id } });
  if (employeeCount > 0) {
    throw ApiError.conflict("department: cannot delete a department with assigned employees");
  }
  await prisma.department.delete({ where: { id } });
}
