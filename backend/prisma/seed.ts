// Seed data for PeoplePay360. Produces enough departments/employees/contracts/
// attendance/leave/payroll history for the dashboard charts and both demo
// scenarios (employee-to-payslip, leave allocation-to-request) to show real
// numbers, per docs/roles/DATABASE.md.
//
// Keeps the 5 system roles and the admin login intact — other modules depend
// on them (see prior version of this file / docs/roles/DATABASE.md).
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
    where: { id: "seed-sched-standard" },
    update: {},
    create: { id: "seed-sched-standard", name: "Standard 9-to-6", type: "full_time", weeklyHours: 40 },
  });
  const scheduleLines = [
    ["monday", "09:00", "18:00"],
    ["tuesday", "09:00", "18:00"],
    ["wednesday", "09:00", "18:00"],
    ["thursday", "09:00", "18:00"],
    ["friday", "09:00", "18:00"],
  ] as const;
  for (const [day, start, end] of scheduleLines) {
    await prisma.scheduleLine.upsert({
      where: { id: `seed-schedline-${day}` },
      update: {},
      create: {
        id: `seed-schedline-${day}`,
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
    { key: "engineering", id: "seed-dept-engineering", name: "Engineering" },
    { key: "sales", id: "seed-dept-sales", name: "Sales" },
    { key: "hr", id: "seed-dept-hr", name: "Human Resources" },
    { key: "finance", id: "seed-dept-finance", name: "Finance" },
    { key: "marketing", id: "seed-dept-marketing", name: "Marketing" },
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
    where: { id: "seed-structure-standard" },
    update: {},
    create: { id: "seed-structure-standard", name: "Standard Structure", active: true },
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
    { id: "seed-rule-basic", name: "Basic Salary", code: "BASIC", category: "basic", sequence: 10, computationMethod: "formula", formula: "contract.wage" },
    { id: "seed-rule-hra", name: "House Rent Allowance", code: "HRA", category: "allowance", sequence: 20, computationMethod: "percentage", baseField: "BASIC", percentage: 20 },
    { id: "seed-rule-transport", name: "Transport Allowance", code: "TRANSPORT", category: "allowance", sequence: 30, computationMethod: "fixed", fixedAmount: 2000 },
    { id: "seed-rule-gross", name: "Gross Salary", code: "GROSS", category: "gross", sequence: 40, computationMethod: "formula", formula: "BASIC+HRA+TRANSPORT" },
    { id: "seed-rule-pf", name: "Provident Fund", code: "PF", category: "deduction", sequence: 50, computationMethod: "percentage", baseField: "BASIC", percentage: 12 },
    { id: "seed-rule-tax", name: "Income Tax", code: "TAX", category: "deduction", sequence: 60, computationMethod: "percentage", baseField: "GROSS", percentage: 10 },
    { id: "seed-rule-net", name: "Net Salary", code: "NET", category: "net", sequence: 70, computationMethod: "formula", formula: "GROSS-PF-TAX" },
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
    { id: "seed-emp-admin", name: "System Administrator", deptKey: "hr", job: "Administrator", role: "ADMIN" as const, email: "admin@peoplepay360.dev", password: "Admin@123", noContract: true, noSchedule: true },
    { id: "seed-emp-hrmanager", name: "Rahul Verma", deptKey: "hr", job: "HR Manager", role: "HR_MANAGER" as const, email: "hr.manager@peoplepay360.dev", password: "Manager@123", wage: 65000 },
    { id: "seed-emp-payrolluser", name: "Priya Sharma", deptKey: "finance", job: "Payroll Executive", role: "HR_PAYROLL_USER" as const, email: "payroll.user@peoplepay360.dev", password: "Payroll@123", wage: 60000 },
    { id: "seed-emp-payrollmanager", name: "Ananya Iyer", deptKey: "finance", job: "Payroll Manager", role: "HR_PAYROLL_MANAGER" as const, email: "payroll.manager@peoplepay360.dev", password: "Payroll@123", wage: 90000 },

    { id: "seed-emp-eng-head", name: "Vikram Nair", deptKey: "engineering", job: "Engineering Head", wage: 150000 },
    { id: "seed-emp-eng-1", name: "Arjun Mehta", deptKey: "engineering", job: "Senior Software Engineer", managerKey: "seed-emp-eng-head", wage: 95000, role: "EMPLOYEE" as const, email: "employee.demo@peoplepay360.dev", password: "Employee@123" },
    { id: "seed-emp-eng-2", name: "Sneha Kulkarni", deptKey: "engineering", job: "Software Engineer", managerKey: "seed-emp-eng-head", wage: 75000 },
    { id: "seed-emp-eng-3", name: "Rohan Deshmukh", deptKey: "engineering", job: "Software Engineer", managerKey: "seed-emp-eng-head", wage: 72000 },
    { id: "seed-emp-eng-4", name: "Kavya Reddy", deptKey: "engineering", job: "QA Engineer", managerKey: "seed-emp-eng-head", wage: 68000 },
    { id: "seed-emp-eng-5", name: "Aditya Joshi", deptKey: "engineering", job: "DevOps Engineer", managerKey: "seed-emp-eng-head", wage: 82000 },

    { id: "seed-emp-sales-head", name: "Meera Pillai", deptKey: "sales", job: "Sales Head", wage: 120000 },
    { id: "seed-emp-sales-1", name: "Karan Malhotra", deptKey: "sales", job: "Sales Executive", managerKey: "seed-emp-sales-head", wage: 55000 },
    { id: "seed-emp-sales-2", name: "Divya Menon", deptKey: "sales", job: "Sales Executive", managerKey: "seed-emp-sales-head", wage: 55000 },
    { id: "seed-emp-sales-3", name: "Siddharth Rao", deptKey: "sales", job: "Account Manager", managerKey: "seed-emp-sales-head", wage: 62000 },

    { id: "seed-emp-mktg-head", name: "Ishaan Kapoor", deptKey: "marketing", job: "Marketing Head", wage: 110000 },
    { id: "seed-emp-mktg-1", name: "Nisha Agarwal", deptKey: "marketing", job: "Marketing Executive", managerKey: "seed-emp-mktg-head", wage: 52000 },
    { id: "seed-emp-mktg-2", name: "Farhan Sheikh", deptKey: "marketing", job: "Content Strategist", managerKey: "seed-emp-mktg-head", wage: 50000 },

    { id: "seed-emp-fin-1", name: "Pooja Bhatt", deptKey: "finance", job: "Accountant", managerKey: "seed-emp-payrollmanager", wage: 58000 },
    { id: "seed-emp-fin-2", name: "Manish Trivedi", deptKey: "finance", job: "Accounts Executive", managerKey: "seed-emp-payrollmanager", wage: 48000, status: "inactive" as const },

    { id: "seed-emp-hr-1", name: "Ritika Chawla", deptKey: "hr", job: "HR Executive", managerKey: "seed-emp-hrmanager", wage: 50000 },
  ];

  for (const e of EMPLOYEES) {
    await prisma.employee.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
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
  await prisma.department.update({ where: { id: dept.engineering }, data: { headEmployeeId: "seed-emp-eng-head" } });
  await prisma.department.update({ where: { id: dept.sales }, data: { headEmployeeId: "seed-emp-sales-head" } });
  await prisma.department.update({ where: { id: dept.marketing }, data: { headEmployeeId: "seed-emp-mktg-head" } });
  await prisma.department.update({ where: { id: dept.finance }, data: { headEmployeeId: "seed-emp-payrollmanager" } });
  await prisma.department.update({ where: { id: dept.hr }, data: { headEmployeeId: "seed-emp-hrmanager" } });

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
    await prisma.userRole.upsert({
      where: { id: `seed-userrole-${e.id}` },
      update: {},
      create: { id: `seed-userrole-${e.id}`, userId: user.id, roleId: roles[e.role] },
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

    if (e.id === "seed-emp-eng-1" || e.id === "seed-emp-sales-1") {
      await prisma.contract.upsert({
        where: { id: `seed-contract-${e.id}-prev` },
        update: {},
        create: {
          id: `seed-contract-${e.id}-prev`,
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

    const contractId = `seed-contract-${e.id}`;
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
  const weekdays = lastNWeekdays(10);
  for (const e of attendanceEmployees) {
    for (const [i, day] of weekdays.entries()) {
      const isLate = i % 7 === 3 && e.id === "seed-emp-eng-3";
      const inProgress = i === weekdays.length - 1 && e.id === "seed-emp-eng-2";

      const checkIn = new Date(day);
      checkIn.setUTCHours(isLate ? 10 : 9, isLate ? 20 : 0, 0, 0);

      if (inProgress) {
        await prisma.attendance.upsert({
          where: { id: `seed-att-${e.id}-${i}` },
          update: {},
          create: {
            id: `seed-att-${e.id}-${i}`,
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
        where: { id: `seed-att-${e.id}-${i}` },
        update: {},
        create: {
          id: `seed-att-${e.id}-${i}`,
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
    { id: "seed-tot-annual", name: "Annual Leave", unit: "days", requiresAllocation: true, payrollIntegration: true, allocated: 18 },
    { id: "seed-tot-sick", name: "Sick Leave", unit: "days", requiresAllocation: true, payrollIntegration: true, allocated: 8 },
    { id: "seed-tot-unpaid", name: "Unpaid Leave", unit: "days", requiresAllocation: false, payrollIntegration: false, allocated: 0 },
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
      await prisma.timeOffAllocation.upsert({
        where: { id: `seed-alloc-${e.id}-${t.id}` },
        update: {},
        create: {
          id: `seed-alloc-${e.id}-${t.id}`,
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
    { id: "seed-tor-1", empId: "seed-emp-eng-2", typeId: "seed-tot-annual", from: 5, to: 3, duration: 3, status: "validate" as const },
    { id: "seed-tor-2", empId: "seed-emp-sales-2", typeId: "seed-tot-sick", from: 2, to: 1, duration: 2, status: "validate" as const },
    { id: "seed-tor-3", empId: "seed-emp-mktg-1", typeId: "seed-tot-annual", from: -3, to: -1, duration: 3, status: "draft" as const },
    { id: "seed-tor-4", empId: "seed-emp-eng-4", typeId: "seed-tot-annual", from: 10, to: 9, duration: 2, status: "refused" as const },
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
  const payrollEmployees = Object.keys(activeContractIdByEmployee).filter((id) => id !== "seed-emp-admin");
  const computedByUserId = userByEmployee["seed-emp-payrolluser"];
  const validatedByUserId = userByEmployee["seed-emp-payrollmanager"];

  const PAYRUNS = [
    { id: "seed-payrun-m2", monthsAgo: 2, status: "paid" as const },
    { id: "seed-payrun-m1", monthsAgo: 1, status: "validated" as const },
    { id: "seed-payrun-m0", monthsAgo: 0, status: "computed" as const },
  ];

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

      const payslipId = `seed-payslip-${p.id}-${empId}`;
      const payslipStatus = isPaid ? "paid" : isValidated ? "validated" : "computed";

      await prisma.payslip.upsert({
        where: { id: payslipId },
        update: {},
        create: {
          id: payslipId,
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
        await prisma.payslipLine.upsert({
          where: { id: `${payslipId}-${line.rule.code}` },
          update: {},
          create: {
            id: `${payslipId}-${line.rule.code}`,
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
