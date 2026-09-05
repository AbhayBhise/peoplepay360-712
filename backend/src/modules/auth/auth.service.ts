import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, RoleName } from "../../middleware/auth";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: { include: { role: true } }, employee: true },
  });

  // Deliberately identical error for "no such user" and "wrong password" —
  // never leak which one it was (security.md).
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("invalid email or password");
  }

  const roles = user.userRoles.map((ur) => ur.role.name as RoleName);

  const payload: AuthPayload = {
    userId: user.id,
    employeeId: user.employeeId,
    roles,
  };

  const signOptions: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] };
  const token = jwt.sign(payload, env.jwtSecret, signOptions);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      employeeName: user.employee?.name ?? null,
      roles,
    },
  };
}

export async function getMe(auth: AuthPayload) {
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { employee: true },
  });
  if (!user) {
    throw ApiError.notFound("user: not found");
  }
  return {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    employeeName: user.employee?.name ?? null,
    roles: auth.roles,
  };
}
