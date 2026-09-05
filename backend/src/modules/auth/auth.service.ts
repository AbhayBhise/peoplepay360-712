import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";
import { prisma } from "../../prisma";
import { ApiError } from "../../utils/ApiError";
import { AuthPayload, RoleName } from "../../middleware/auth";
import { sendMail } from "../../utils/mailer";

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

// Public self-registration — creates an account with EMPLOYEE role.
// Does NOT require an existing Admin session.
export async function register(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict("email: an account with this email already exists");
  }

  // Resolve EMPLOYEE role id
  const employeeRole = await prisma.role.findFirst({ where: { name: "EMPLOYEE" } });
  if (!employeeRole) {
    throw ApiError.internal("Role configuration error — contact your administrator");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      userRoles: {
        create: [{ roleId: employeeRole.id, grantedBy: "self-registration" }],
      },
    },
    include: { userRoles: { include: { role: true } }, employee: true },
  });

  const roles = user.userRoles.map((ur) => ur.role.name as RoleName);
  const payload: AuthPayload = { userId: user.id, employeeId: null, roles };
  const signOptions: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] };
  const token = jwt.sign(payload, env.jwtSecret, signOptions);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name,
      employeeId: null,
      employeeName: name,
      roles,
    },
  };
}

export async function getMe(auth: AuthPayload) {
  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    include: { employee: { include: { department: true, manager: true } } },
  });
  if (!user) {
    throw ApiError.notFound("user: not found");
  }
  const employee = user.employee;
  return {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    employeeName: employee?.name ?? null,
    jobPosition: employee?.jobPosition ?? null,
    status: employee?.status ?? null,
    department: employee?.department ? { id: employee.department.id, name: employee.department.name } : null,
    manager: employee?.manager ? { id: employee.manager.id, name: employee.manager.name } : null,
    memberSince: employee?.createdAt ?? user.createdAt,
    roles: auth.roles,
  };
}

// Self-service change-password — distinct from the admin's setUserActive/updateUserRoles
// path, which never touches passwordHash. Requires the current password so a hijacked,
// still-logged-in session can't lock the real owner out silently.
export async function changePassword(auth: AuthPayload, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) {
    throw ApiError.notFound("user: not found");
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized("current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Deliberately fail silently if user not found to prevent email enumeration
  if (!user || !user.isActive) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const resetLink = `${env.frontendUrl}/reset-password?token=${token}`;
  
  await sendMail({
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the link to reset your password: ${resetLink}\nThis link expires in 1 hour.`,
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    throw ApiError.badRequest("invalid or expired password reset token");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and mark token as used in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);
}
