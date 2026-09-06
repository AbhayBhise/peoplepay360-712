import { z } from "zod";
import { passwordSchema } from "../../utils/passwordPolicy";

const ROLE_NAMES = ["EMPLOYEE", "HR_MANAGER", "HR_PAYROLL_USER", "HR_PAYROLL_MANAGER", "ADMIN"] as const;

export const createUserSchema = z.object({
  email: z.string().email({ message: "must be a valid email address" }),
  password: passwordSchema,
  employeeId: z.string().min(1).optional().nullable(),
  roleNames: z.array(z.enum(ROLE_NAMES)).min(1, { message: "assign at least one role" }),
});

export const updateUserRolesSchema = z.object({
  roleNames: z.array(z.enum(ROLE_NAMES)).min(1, { message: "assign at least one role" }),
});
