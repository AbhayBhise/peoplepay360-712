// Minimal seed so login and Employee CRUD are testable end-to-end.
// Disha: extend this with more departments/employees/schedules as the DB module grows —
// keep the 5 system roles and the admin login intact, other modules depend on them.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLE_NAMES = [
  "EMPLOYEE",
  "HR_MANAGER",
  "HR_PAYROLL_USER",
  "HR_PAYROLL_MANAGER",
  "ADMIN",
] as const;

async function main() {
  const roles: Record<string, string> = {};
  for (const name of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystemRole: true },
    });
    roles[name] = role.id;
  }

  const dept = await prisma.department.upsert({
    where: { id: "seed-dept-engineering" },
    update: {},
    create: { id: "seed-dept-engineering", name: "Engineering" },
  });

  const adminEmployee = await prisma.employee.upsert({
    where: { id: "seed-emp-admin" },
    update: {},
    create: {
      id: "seed-emp-admin",
      name: "System Administrator",
      departmentId: dept.id,
      jobPosition: "Administrator",
      status: "active",
    },
  });

  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@peoplepay360.dev" },
    update: {},
    create: {
      email: "admin@peoplepay360.dev",
      passwordHash,
      employeeId: adminEmployee.id,
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { id: "seed-userrole-admin" },
    update: {},
    create: {
      id: "seed-userrole-admin",
      userId: adminUser.id,
      roleId: roles["ADMIN"],
    },
  });

  console.log("Seed complete. Login with admin@peoplepay360.dev / Admin@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
