import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { createUserSchema, updateUserRolesSchema } from "./adminUser.validation";
import { PaginationParams, paginatedResult } from "../../utils/pagination";

type CreateInput = z.infer<typeof createUserSchema>;
type UpdateRolesInput = z.infer<typeof updateUserRolesSchema>;

function toSummary(user: {
  id: string;
  email: string;
  employeeId: string | null;
  isActive: boolean;
  employee: { name: string } | null;
  userRoles: { role: { name: string }; effectiveTo: Date | null }[];
}) {
  return {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    employeeName: user.employee?.name ?? null,
    isActive: user.isActive,
    roles: user.userRoles.filter((ur) => !ur.effectiveTo).map((ur) => ur.role.name),
  };
}

const include = { employee: { select: { name: true } }, userRoles: { include: { role: true } } } as const;

export async function listUsers(pagination?: PaginationParams) {
  if (!pagination) {
    const users = await prisma.user.findMany({ include, orderBy: { email: "asc" } });
    return users.map(toSummary);
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({ include, orderBy: { email: "asc" }, skip: pagination.skip, take: pagination.take }),
    prisma.user.count(),
  ]);
  return paginatedResult(users.map(toSummary), total, pagination);
}

async function resolveRoleIds(roleNames: string[]) {
  const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
  if (roles.length !== roleNames.length) {
    const found = new Set(roles.map((r) => r.name));
    const missing = roleNames.filter((n) => !found.has(n));
    throw ApiError.badRequest(`roleNames: unknown role(s): ${missing.join(", ")}`);
  }
  return roles;
}

// Admin capability explicitly required by the problem statement's role table ("User
// management, role assignment, permission updates") but never implemented until now —
// there was previously no way to create a user or grant a role except direct DB seeding.
export async function createUser(grantedByUserId: string, input: CreateInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict(`email: an account with ${input.email} already exists`);
  }
  if (input.employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee) throw ApiError.badRequest(`employeeId: no employee with id ${input.employeeId}`);
  }

  const roles = await resolveRoleIds(input.roleNames);
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      employeeId: input.employeeId ?? undefined,
      userRoles: {
        create: roles.map((r) => ({ roleId: r.id, grantedBy: grantedByUserId })),
      },
    },
    include,
  });

  return toSummary(user);
}

// Replaces the active role set: closes out (effectiveTo = now) any role no longer in the
// new list, and grants (new UserRole row) anything not already active — preserves history
// via effectiveFrom/effectiveTo rather than deleting rows, per docs/01_DATABASE_SCHEMA.md.
export async function updateUserRoles(grantedByUserId: string, userId: string, input: UpdateRolesInput) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include });
  if (!user) throw ApiError.notFound(`user: no user with id ${userId}`);

  const targetRoles = await resolveRoleIds(input.roleNames);
  const targetIds = new Set(targetRoles.map((r) => r.id));
  const activeGrants = user.userRoles.filter((ur: any) => !ur.effectiveTo);
  const activeRoleIds = new Set(activeGrants.map((ur: any) => ur.roleId));

  const toRevoke = activeGrants.filter((ur: any) => !targetIds.has(ur.roleId));
  const toGrant = targetRoles.filter((r) => !activeRoleIds.has(r.id));

  await prisma.$transaction([
    ...toRevoke.map((ur: any) =>
      prisma.userRole.update({ where: { id: ur.id }, data: { effectiveTo: new Date() } })
    ),
    ...toGrant.map((r) =>
      prisma.userRole.create({ data: { userId, roleId: r.id, grantedBy: grantedByUserId } })
    ),
  ]);

  const updated = await prisma.user.findUnique({ where: { id: userId }, include });
  return toSummary(updated!);
}

export async function setUserActive(userId: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound(`user: no user with id ${userId}`);
  const updated = await prisma.user.update({ where: { id: userId }, data: { isActive }, include });
  return toSummary(updated);
}
