// Seed data for PeoplePay360. Produces enough departments/employees/contracts/
// attendance/leave/payroll history for the dashboard charts and both demo
// scenarios (employee-to-payslip, leave allocation-to-request) to show real
// numbers, per docs/roles/DATABASE.md.
//
// Keeps the 5 system roles and the admin login intact — other modules depend
// on them (see prior version of this file / docs/roles/DATABASE.md).
import { randomUUID } from "crypto";
import { PrismaClient, SalaryRuleCategory, ComputationMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROLE_NAMES = [
  "EMPLOYEE",
  "HR_MANAGER",
  "HR_PAYROLL_USER",
  "HR_PAYROLL_MANAGER",
  "ADMIN",
] as const;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function monthsAgoRange(n: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n + 1, 0));
  return { start, end };
}

function lastNWeekdays(n: number): Date[] {
  const out: Date[] = [];
  let cursor = daysAgo(1);
  while (out.length < n) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) out.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return out.reverse();
}

function workedHours(checkIn: Date, checkOut: Date): number {
  return Math.round(((checkOut.getTime() - checkIn.getTime()) / 3_600_000) * 100) / 100;
}

async function main() {
  // ---------- Roles (unchanged — other modules depend on these existing) ----------
  const roles: Record<string, string> = {};
  for (const name of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystemRole: true },
    });
    roles[name] = role.id;
  }

  // ---------- Working schedule ----------
  // weeklyHours is computed once here (5 * (9h - 1h break) = 40), the same way a
  // working-schedule service would recompute it from schedule_lines — never a
  // manually typed value. See docs/03_DB_DESIGN_NOTES.md for the caveat that no
  // such service exists yet to enforce this at write time.
  const schedule = await prisma.workingSchedule.upsert({
    where: { id: "91350275-25e4-4412-96d2-5c3fb25c5825" },
    update: {},
    create: { id: "91350275-25e4-4412-96d2-5c3fb25c5825", name: "Standard 9-to-6", type: "full_time", weeklyHours: 40 },
  });
  const scheduleLines = [
    ["monday", "09:00", "18:00"],
    ["tuesday", "09:00", "18:00"],
    ["wednesday", "09:00", "18:00"],
    ["thursday", "09:00", "18:00"],
    ["friday", "09:00", "18:00"],
  ] as const;
  for (const [day, start, end] of scheduleLines) {
    const lineId = randomUUID();
    await prisma.scheduleLine.upsert({
      where: { id: lineId },
      update: {},
      create: {
        id: lineId,
        scheduleId: schedule.id,
        day,
        startTime: start,
        endTime: end,
        breakMins: 60,
      },
    });
  }

  // ---------- Departments ----------
  const DEPARTMENTS = [
    { key: "engineering", id: "a93d3fa5-0dde-4535-ac6f-dfd74a012b8c", name: "Engineering" },
    { key: "sales", id: "892eaa08-7cc6-4ad9-80de-de4236026f34", name: "Sales" },
    { key: "hr", id: "fc2b717a-0ea7-4384-aa0b-3c9161f64d6e", name: "Human Resources" },
    { key: "finance", id: "7d25a758-c706-47d3-af21-f4663db4c702", name: "Finance" },
    { key: "marketing", id: "da4f7ef6-6910-4cb5-be45-e56e11ccb247", name: "Marketing" },
  ] as const;
  const dept: Record<string, string> = {};
  for (const d of DEPARTMENTS) {
    const row = await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, name: d.name },
    });
    dept[d.key] = row.id;
  }

  // ---------- Salary structure + rules ----------
  const structure = await prisma.salaryStructure.upsert({
    where: { id: "85c83b49-19fa-4f52-9f1b-6f3917c09025" },
    update: {},
    create: { id: "85c83b49-19fa-4f52-9f1b-6f3917c09025", name: "Standard Structure", active: true },
  });
  const RULES: Array<{
    id: string;
    name: string;
    code: string;
    category: SalaryRuleCategory;
    sequence: number;
    computationMethod: ComputationMethod;
    fixedAmount?: number;
    percentage?: number;
    baseField?: string;
    formula?: string;
  }> = [
    { id: "8b6207d0-baef-477a-aec4-9ec4e2d48370", name: "Basic Salary", code: "BASIC", category: "basic", sequence: 10, computationMethod: "formula", formula: "WAGE / 30 * WORKED_DAYS" },
    { id: "21faed5d-b71b-47b8-918d-a6752c987863", name: "House Rent Allowance", code: "HRA", category: "allowance", sequence: 20, computationMethod: "percentage", baseField: "BASIC", percentage: 20 },
    { id: "75c9c5a5-421a-4c62-bee4-e6f618c0474f", name: "Transport Allowance", code: "TRANSPORT", category: "allowance", sequence: 30, computationMethod: "fixed", fixedAmount: 2000 },
    { id: "648ef3c2-a42a-41a8-8b9b-d71d32368afc", name: "Gross Salary", code: "GROSS", category: "gross", sequence: 40, computationMethod: "formula", formula: "BASIC+HRA+TRANSPORT" },
    { id: "4be4aac5-e713-462b-97d0-0c37a095785e", name: "Provident Fund", code: "PF", category: "deduction", sequence: 50, computationMethod: "percentage", baseField: "BASIC", percentage: 12 },
    { id: "3705e9ba-df4f-4a62-99ed-0d0a4677359e", name: "Income Tax", code: "TAX", category: "deduction", sequence: 60, computationMethod: "percentage", baseField: "GROSS", percentage: 10 },
    { id: "286aaa90-394f-4c94-b86f-3517339cebe3", name: "Net Salary", code: "NET", category: "net", sequence: 70, computationMethod: "formula", formula: "GROSS-PF-TAX" },
  ];
  for (const r of RULES) {
    await prisma.salaryRule.upsert({
      where: { id: r.id },
      update: {},
      create: { ...r, structureId: structure.id },
    });
  }

  // ---------- Employees ----------
  // role: which system role (if any) gets a login for this seed employee.
  const EMPLOYEES = [
    { id: "75131a57-bc3d-4fca-8e4c-a68932394e4c", name: "System Administrator", deptKey: "hr", job: "Administrator", role: "ADMIN" as const, email: "admin@peoplepay360.dev", password: "Admin@123", noContract: true, noSchedule: true },
    { id: "20e80ed7-ef86-43bc-93de-03d92adbd425", name: "Rahul Verma", deptKey: "hr", job: "HR Manager", role: "HR_MANAGER" as const, email: "hr.manager@peoplepay360.dev", password: "Manager@123", wage: 65000 },
    { id: "33c4e540-13e6-4235-b632-1047724983f6", name: "Priya Sharma", deptKey: "finance", job: "Payroll Executive", role: "HR_PAYROLL_USER" as const, email: "payroll.user@peoplepay360.dev", password: "Payroll@123", wage: 60000 },
    { id: "b9e12e10-5489-4e08-890e-17e9d0b210b3", name: "Ananya Iyer", deptKey: "finance", job: "Payroll Manager", role: "HR_PAYROLL_MANAGER" as const, email: "payroll.manager@peoplepay360.dev", password: "Payroll@123", wage: 90000 },

    { id: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", name: "Vikram Nair", deptKey: "engineering", job: "Engineering Head", wage: 150000 },
    { id: "ebe1e5a7-3853-4eb1-9ae3-52439def3d30", name: "Arjun Mehta", deptKey: "engineering", job: "Senior Software Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 95000, role: "EMPLOYEE" as const, email: "employee.demo@peoplepay360.dev", password: "Employee@123" },
    { id: "7e8ada7c-af0c-42b3-a966-4969f57e71ed", name: "Sneha Kulkarni", deptKey: "engineering", job: "Software Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 75000 },
    { id: "7dd3412f-952b-48bd-ac76-c7225ac19ac3", name: "Rohan Deshmukh", deptKey: "engineering", job: "Software Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 72000 },
    { id: "1b7e08b3-97e4-4bf1-bf3f-07a0a5dfb39a", name: "Kavya Reddy", deptKey: "engineering", job: "QA Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 68000 },
    { id: "ed05196f-0631-42c5-8b67-9b505bf288d6", name: "Aditya Joshi", deptKey: "engineering", job: "DevOps Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 82000 },

    { id: "af88a239-b90f-40cc-bb27-6143ddb22a1e", name: "Meera Pillai", deptKey: "sales", job: "Sales Head", wage: 120000 },
    { id: "0f583e8d-e6f2-4065-945b-5fdbb22daf99", name: "Karan Malhotra", deptKey: "sales", job: "Sales Executive", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 55000 },
    { id: "59720abe-c997-4767-94ed-437bc34e8c6f", name: "Divya Menon", deptKey: "sales", job: "Sales Executive", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 55000 },
    { id: "bd31c6e1-2eda-42c1-ba6b-7d742c3f388c", name: "Siddharth Rao", deptKey: "sales", job: "Account Manager", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 62000 },

    { id: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", name: "Ishaan Kapoor", deptKey: "marketing", job: "Marketing Head", wage: 110000 },
    { id: "5f9c33c3-1bba-4f5b-b991-e40a222d90be", name: "Nisha Agarwal", deptKey: "marketing", job: "Marketing Executive", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 52000 },
    { id: "b072b812-b22d-4bd2-9e5e-05c2bba9a860", name: "Farhan Sheikh", deptKey: "marketing", job: "Content Strategist", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 50000 },

    { id: "e2b55d93-3ba8-4eaa-982e-b57528cf5167", name: "Pooja Bhatt", deptKey: "finance", job: "Accountant", managerKey: "b9e12e10-5489-4e08-890e-17e9d0b210b3", wage: 58000 },
    { id: "3acfd31c-65b5-4943-a4b3-faa695ce2fad", name: "Manish Trivedi", deptKey: "finance", job: "Accounts Executive", managerKey: "b9e12e10-5489-4e08-890e-17e9d0b210b3", wage: 48000, status: "inactive" as const },

    { id: "292d8682-8f4d-41eb-84da-20d16693bd7f", name: "Ritika Chawla", deptKey: "hr", job: "HR Executive", managerKey: "20e80ed7-ef86-43bc-93de-03d92adbd425", wage: 50000 },

    // --- Additional Engineering Staff ---
    { id: randomUUID(), name: "Tanvi Shah", deptKey: "engineering", job: "Frontend Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 70000 },
    { id: randomUUID(), name: "Harshit Patel", deptKey: "engineering", job: "Backend Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 74000 },
    { id: randomUUID(), name: "Neha Gupta", deptKey: "engineering", job: "Full Stack Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 80000 },
    { id: randomUUID(), name: "Amit Singhania", deptKey: "engineering", job: "Site Reliability Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 85000 },
    { id: randomUUID(), name: "Pallavi Sen", deptKey: "engineering", job: "Data Engineer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 78000 },
    { id: randomUUID(), name: "Yash Chopra", deptKey: "engineering", job: "Mobile Developer", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 72000 },
    { id: randomUUID(), name: "Shweta Roy", deptKey: "engineering", job: "Cloud Architect", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 115000 },
    { id: randomUUID(), name: "Kunal Bajaj", deptKey: "engineering", job: "Systems Analyst", managerKey: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a", wage: 65000 },

    // --- Additional Sales Staff ---
    { id: randomUUID(), name: "Deepak Soni", deptKey: "sales", job: "Enterprise Sales Rep", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 68000 },
    { id: randomUUID(), name: "Bhavna Jain", deptKey: "sales", job: "Inside Sales Specialist", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 54000 },
    { id: randomUUID(), name: "Sameer Saxena", deptKey: "sales", job: "Business Development Rep", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 48000 },
    { id: randomUUID(), name: "Monica Sharma", deptKey: "sales", job: "Sales Operations Analyst", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 58000 },
    { id: randomUUID(), name: "Gaurav Kapoor", deptKey: "sales", job: "Key Account Director", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 95000 },
    { id: randomUUID(), name: "Ritu Bansal", deptKey: "sales", job: "Pre-Sales Consultant", managerKey: "af88a239-b90f-40cc-bb27-6143ddb22a1e", wage: 75000 },

    // --- Additional Marketing Staff ---
    { id: randomUUID(), name: "Aakash Saxena", deptKey: "marketing", job: "Product Marketing Manager", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 82000 },
    { id: randomUUID(), name: "Swati Das", deptKey: "marketing", job: "SEO & Growth Specialist", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 54000 },
    { id: randomUUID(), name: "Nikhil Varma", deptKey: "marketing", job: "Graphic & Brand Designer", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 52000 },
    { id: randomUUID(), name: "Prachi Mehra", deptKey: "marketing", job: "Social Media Lead", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 48000 },
    { id: randomUUID(), name: "Mohit Ahuja", deptKey: "marketing", job: "Email Marketing Specialist", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 46000 },
    { id: randomUUID(), name: "Tara Sundaram", deptKey: "marketing", job: "PR & Communications Manager", managerKey: "bf0cc423-0294-4857-90fe-0e0f15bf45f4", wage: 78000 },

    // --- Additional Finance Staff ---
    { id: randomUUID(), name: "Rajat Goel", deptKey: "finance", job: "Senior Financial Analyst", managerKey: "b9e12e10-5489-4e08-890e-17e9d0b210b3", wage: 75000 },
    { id: randomUUID(), name: "Anjali Shrestha", deptKey: "finance", job: "Billing Specialist", managerKey: "b9e12e10-5489-4e08-890e-17e9d0b210b3", wage: 50000 },
    { id: randomUUID(), name: "Tarun Aggarwal", deptKey: "finance", job: "Internal Auditor", managerKey: "b9e12e10-5489-4e08-890e-17e9d0b210b3", wage: 68000 },
    { id: randomUUID(), name: "Namrata Kaul", deptKey: "finance", job: "Treasury Analyst", managerKey: "b9e12e10-5489-4e08-890e-17e9d0b210b3", wage: 62000 },
    { id: randomUUID(), name: "Vivek Pandey", deptKey: "finance", job: "Compliance Officer", managerKey: "b9e12e10-5489-4e08-890e-17e9d0b210b3", wage: 72000 },

    // --- Additional HR Staff ---
    { id: randomUUID(), name: "Sagarika Bose", deptKey: "hr", job: "Talent Acquisition Specialist", managerKey: "20e80ed7-ef86-43bc-93de-03d92adbd425", wage: 55000 },
    { id: randomUUID(), name: "Varun Bhatia", deptKey: "hr", job: "HR Operations Executive", managerKey: "20e80ed7-ef86-43bc-93de-03d92adbd425", wage: 48000 },
    { id: randomUUID(), name: "Divyanshu Sinha", deptKey: "hr", job: "People & Culture Manager", managerKey: "20e80ed7-ef86-43bc-93de-03d92adbd425", wage: 78000 },
    { id: randomUUID(), name: "Kiran Mazumdar", deptKey: "hr", job: "Learning & Development Lead", managerKey: "20e80ed7-ef86-43bc-93de-03d92adbd425", wage: 65000 },
    { id: randomUUID(), name: "Shilpa Shetty", deptKey: "hr", job: "Compensation & Benefits Analyst", managerKey: "20e80ed7-ef86-43bc-93de-03d92adbd425", wage: 62000 },
  ];

  for (const [idx, e] of EMPLOYEES.entries()) {
    const employeeCode = `EMP-${String(idx + 1).padStart(4, "0")}`;
    await prisma.employee.upsert({
      where: { id: e.id },
      update: { employeeCode },
      create: {
        id: e.id,
        employeeCode,
        name: e.name,
        departmentId: dept[e.deptKey],
        jobPosition: e.job,
        status: e.status ?? "active",
        managerId: e.managerKey ?? null,
        workingScheduleId: e.noSchedule ? null : schedule.id,
      },
    });
  }

  // Department heads, set after employees exist (FK).
  await prisma.department.update({ where: { id: dept.engineering }, data: { headEmployeeId: "dfa27582-9c0c-422f-8576-1ad2f8d7ba1a" } });
  await prisma.department.update({ where: { id: dept.sales }, data: { headEmployeeId: "af88a239-b90f-40cc-bb27-6143ddb22a1e" } });
  await prisma.department.update({ where: { id: dept.marketing }, data: { headEmployeeId: "bf0cc423-0294-4857-90fe-0e0f15bf45f4" } });
  await prisma.department.update({ where: { id: dept.finance }, data: { headEmployeeId: "b9e12e10-5489-4e08-890e-17e9d0b210b3" } });
  await prisma.department.update({ where: { id: dept.hr }, data: { headEmployeeId: "20e80ed7-ef86-43bc-93de-03d92adbd425" } });

  // ---------- Users + roles (logins) ----------
  const userByEmployee: Record<string, string> = {};
  for (const e of EMPLOYEES) {
    if (!e.role || !e.email || !e.password) continue;
    const passwordHash = await bcrypt.hash(e.password, 10);
    const user = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: { email: e.email, passwordHash, employeeId: e.id, isActive: true },
    });
    userByEmployee[e.id] = user.id;
    const userRoleId = randomUUID();
    await prisma.userRole.upsert({
      where: { id: userRoleId },
      update: {},
      create: { id: userRoleId, userId: user.id, roleId: roles[e.role] },
    });
  }

  // ---------- Contracts ----------
  // One active contract per (non-admin) employee. A few also get a prior expired
  // contract to show history — kept strictly before the active one so it never
  // trips the no-overlapping-active-ranges exclusion constraint (that constraint
  // only applies to status='active' rows anyway).
  const activeContractIdByEmployee: Record<string, string> = {};
  for (const e of EMPLOYEES) {
    if (e.noContract) continue;
    const wage = e.wage ?? 50000;

    if (e.id === "ebe1e5a7-3853-4eb1-9ae3-52439def3d30" || e.id === "0f583e8d-e6f2-4065-945b-5fdbb22daf99") {
      const prevContractId = randomUUID();
      await prisma.contract.upsert({
        where: { id: prevContractId },
        update: {},
        create: {
          id: prevContractId,
          employeeId: e.id,
          departmentId: dept[e.deptKey],
          position: e.job,
          wage: Math.round(wage * 0.85),
          salaryStructureId: structure.id,
          startDate: new Date(Date.UTC(2024, 0, 1)),
          endDate: new Date(Date.UTC(2024, 11, 31)),
          status: "expired",
        },
      });
    }

    const contractId = randomUUID();
    await prisma.contract.upsert({
      where: { id: contractId },
      update: {},
      create: {
        id: contractId,
        employeeId: e.id,
        departmentId: dept[e.deptKey],
        position: e.job,
        wage,
        salaryStructureId: structure.id,
        startDate: new Date(Date.UTC(2025, 0, 1)),
        endDate: null,
        status: e.status === "inactive" ? "cancelled" : "active",
      },
    });
    if (e.status !== "inactive") activeContractIdByEmployee[e.id] = contractId;
  }

  // ---------- Attendance ----------
  // worked_hours is always the computed diff of check_out - check_in, written
  // once here at seed time — never a value someone typed in directly.
  const attendanceEmployees = EMPLOYEES.filter((e) => !e.noSchedule && e.status !== "inactive");
  const weekdays = lastNWeekdays(22);
  for (const e of attendanceEmployees) {
    for (const [i, day] of weekdays.entries()) {
      const isLate = i % 7 === 3 && e.id === "7dd3412f-952b-48bd-ac76-c7225ac19ac3";
      const inProgress = i === weekdays.length - 1 && e.id === "7e8ada7c-af0c-42b3-a966-4969f57e71ed";

      const checkIn = new Date(day);
      checkIn.setUTCHours(isLate ? 10 : 9, isLate ? 20 : 0, 0, 0);

      const attendanceId = randomUUID();
      if (inProgress) {
        await prisma.attendance.upsert({
          where: { id: attendanceId },
          update: {},
          create: {
            id: attendanceId,
            employeeId: e.id,
            checkIn,
            checkOut: null,
            workedHours: 0,
            status: "present",
          },
        });
        continue;
      }

      const checkOut = new Date(day);
      checkOut.setUTCHours(18, 5, 0, 0);

      await prisma.attendance.upsert({
        where: { id: attendanceId },
        update: {},
        create: {
          id: attendanceId,
          employeeId: e.id,
          checkIn,
          checkOut,
          workedHours: workedHours(checkIn, checkOut),
          status: isLate ? "late" : "present",
        },
      });
    }
  }

  // ---------- Time off ----------
  const TIME_OFF_TYPES = [
    { id: "a2955ddf-7c5d-4c91-84bb-e4761be01e73", name: "Annual Leave", unit: "days", requiresAllocation: true, payrollIntegration: true, allocated: 18 },
    { id: "69abe6d4-659f-430e-810f-268393773a1d", name: "Sick Leave", unit: "days", requiresAllocation: true, payrollIntegration: true, allocated: 8 },
    { id: "73958f68-bf93-414f-8af9-84d2e0f6b0b3", name: "Unpaid Leave", unit: "days", requiresAllocation: false, payrollIntegration: false, allocated: 0 },
  ];
  for (const t of TIME_OFF_TYPES) {
    await prisma.timeOffType.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        name: t.name,
        unit: t.unit,
        requiresAllocation: t.requiresAllocation,
        payrollIntegration: t.payrollIntegration,
      },
    });
  }

  const leaveEmployees = EMPLOYEES.filter((e) => !e.noContract && e.status !== "inactive");
  for (const e of leaveEmployees) {
    for (const t of TIME_OFF_TYPES.filter((t) => t.requiresAllocation)) {
      const allocId = randomUUID();
      await prisma.timeOffAllocation.upsert({
        where: { id: allocId },
        update: {},
        create: {
          id: allocId,
          employeeId: e.id,
          typeId: t.id,
          allocated: t.allocated,
          taken: 0,
          validFrom: new Date(Date.UTC(2026, 0, 1)),
          validTo: new Date(Date.UTC(2026, 11, 31)),
          status: "validate",
        },
      });
    }
  }

  // A few requests in different states, so both demo scenarios have real data:
  // one approved (balance deducted on approval, never on creation), one pending,
  // one refused (no balance change).
  const leaveRequests = [
    { id: "7fcce22f-f5b5-44c4-a3c2-73e519638628", empId: "7e8ada7c-af0c-42b3-a966-4969f57e71ed", typeId: "a2955ddf-7c5d-4c91-84bb-e4761be01e73", from: 5, to: 3, duration: 3, status: "validate" as const },
    { id: "2e03af8c-0351-4d94-a769-f8db2d086f49", empId: "59720abe-c997-4767-94ed-437bc34e8c6f", typeId: "69abe6d4-659f-430e-810f-268393773a1d", from: 2, to: 1, duration: 2, status: "validate" as const },
    { id: "26c2c1db-ad60-4081-ae0f-ddcb2861c2f2", empId: "5f9c33c3-1bba-4f5b-b991-e40a222d90be", typeId: "a2955ddf-7c5d-4c91-84bb-e4761be01e73", from: -3, to: -1, duration: 3, status: "draft" as const },
    { id: "e833b361-afa2-4298-8d8a-842cec4e3a6d", empId: "1b7e08b3-97e4-4bf1-bf3f-07a0a5dfb39a", typeId: "a2955ddf-7c5d-4c91-84bb-e4761be01e73", from: 10, to: 9, duration: 2, status: "refused" as const },
  ];
  for (const r of leaveRequests) {
    await prisma.timeOffRequest.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        employeeId: r.empId,
        typeId: r.typeId,
        dateFrom: daysAgo(r.from),
        dateTo: daysAgo(r.to),
        duration: r.duration,
        status: r.status,
      },
    });
    if (r.status === "validate") {
      await prisma.timeOffAllocation.updateMany({
        where: { employeeId: r.empId, typeId: r.typeId },
        data: { taken: { increment: r.duration } },
      });
    }
  }

  // ---------- Payroll: 3 monthly payruns, each further along than the last ----------
  const payrollEmployees = Object.keys(activeContractIdByEmployee).filter((id) => id !== "75131a57-bc3d-4fca-8e4c-a68932394e4c");
  const computedByUserId = userByEmployee["33c4e540-13e6-4235-b632-1047724983f6"];
  const validatedByUserId = userByEmployee["b9e12e10-5489-4e08-890e-17e9d0b210b3"];

  const PAYRUNS = [
    { id: "7d05eba0-69f9-40ae-9f2b-756500e6c709", monthsAgo: 2, status: "paid" as const },
    { id: "d44ac1dd-8556-40d9-a4e0-5866a0d91410", monthsAgo: 1, status: "validated" as const },
    { id: "d7c12cf8-51eb-4055-b6cf-94439cb8e361", monthsAgo: 0, status: "computed" as const },
  ];

  let globalPayslipSeq = 1;
  for (const p of PAYRUNS) {
    const { start, end } = monthsAgoRange(p.monthsAgo);
    const isAtLeastComputed = true; // all three are computed-or-further in this seed
    const isValidated = p.status === "validated" || p.status === "paid";
    const isPaid = p.status === "paid";

    await prisma.payrun.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        structureId: structure.id,
        periodStart: start,
        periodEnd: end,
        status: p.status,
        computedBy: isAtLeastComputed ? computedByUserId : null,
        validatedBy: isValidated ? validatedByUserId : null,
      },
    });

    for (const empId of payrollEmployees) {
      const emp = EMPLOYEES.find((e) => e.id === empId)!;
      const wage = emp.wage ?? 50000;

      const basic = wage;
      const hra = Math.round(basic * 0.2);
      const transport = 2000;
      const gross = basic + hra + transport;
      const pf = Math.round(basic * 0.12);
      const tax = Math.round(gross * 0.1);
      const net = gross - pf - tax;

      const payslipId = randomUUID();
      const payslipNumber = `PS-2026-${String(globalPayslipSeq++).padStart(6, "0")}`;
      const payslipStatus = isPaid ? "paid" : isValidated ? "validated" : "computed";

      await prisma.payslip.upsert({
        where: { id: payslipId },
        update: {},
        create: {
          id: payslipId,
          payslipNumber,
          payrunId: p.id,
          employeeId: empId,
          contractId: activeContractIdByEmployee[empId],
          workedDays: 22,
          basic,
          allowances: hra + transport,
          deductions: pf + tax,
          gross,
          net,
          status: payslipStatus,
        },
      });

      const lines: Array<{ rule: (typeof RULES)[number]; amount: number }> = [
        { rule: RULES[0], amount: basic },
        { rule: RULES[1], amount: hra },
        { rule: RULES[2], amount: transport },
        { rule: RULES[3], amount: gross },
        { rule: RULES[4], amount: -pf },
        { rule: RULES[5], amount: -tax },
        { rule: RULES[6], amount: net },
      ];
      for (const line of lines) {
        await prisma.payslipLine.create({
          data: {
            id: randomUUID(),
            payslipId,
            ruleId: line.rule.id,
            category: line.rule.category,
            name: line.rule.name,
            amount: line.amount,
          },
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Logins:");
  console.log("  admin@peoplepay360.dev / Admin@123 (ADMIN)");
  console.log("  hr.manager@peoplepay360.dev / Manager@123 (HR_MANAGER)");
  console.log("  payroll.user@peoplepay360.dev / Payroll@123 (HR_PAYROLL_USER)");
  console.log("  payroll.manager@peoplepay360.dev / Payroll@123 (HR_PAYROLL_MANAGER)");
  console.log("  employee.demo@peoplepay360.dev / Employee@123 (EMPLOYEE)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
