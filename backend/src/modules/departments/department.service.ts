import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { z } from "zod";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.validation";

type CreateInput = z.infer<typeof createDepartmentSchema>;
type UpdateInput = z.infer<typeof updateDepartmentSchema>;

export function listDepartments(parentId?: string) {
  return prisma.department.findMany({
    where: parentId ? { parentDepartmentId: parentId } : undefined,
    orderBy: { name: "asc" },
  });
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
