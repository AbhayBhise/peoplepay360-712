// Seed data for PeoplePay360.
// Fast, batch-inserted high-fidelity dataset with 250 realistic user accounts
// split across all 5 RBAC roles with full interconnected HR, Attendance, Time Off, Contracts, and Payroll history.
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

// Realistic Indian & International corporate names
const FIRST_NAMES = [
  "Rahul", "Priya", "Vikram", "Ananya", "Arjun", "Sneha", "Rohan", "Kavya", "Aditya", "Meera",
  "Karan", "Divya", "Siddharth", "Ishaan", "Nisha", "Farhan", "Pooja", "Manish", "Ritika", "Tanvi",
  "Harshit", "Neha", "Amit", "Pallavi", "Yash", "Shweta", "Kunal", "Deepak", "Bhavna", "Sameer",
  "Monica", "Gaurav", "Ritu", "Aakash", "Swati", "Nikhil", "Prachi", "Mohit", "Tara", "Rajat",
  "Anjali", "Tarun", "Namrata", "Vivek", "Sagarika", "Varun", "Divyanshu", "Kiran", "Shilpa", "Sanjay",
  "Aarti", "Alok", "Chitra", "Dinesh", "Ekta", "Girish", "Hemant", "Indu", "Jatin", "Komal",
  "Lokesh", "Madhav", "Naveen", "Omkar", "Parul", "Qasim", "Rakesh", "Sunita", "Tushar", "Umesh",
  "Vandana", "Waseem", "Yogesh", "Zainab", "Alexander", "Sarah", "Daniel", "Emily", "Michael", "Jessica"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Mehta", "Iyer", "Nair", "Kulkarni", "Deshmukh", "Reddy", "Joshi", "Pillai",
  "Malhotra", "Menon", "Rao", "Kapoor", "Agarwal", "Sheikh", "Bhatt", "Trivedi", "Chawla", "Shah",
  "Patel", "Gupta", "Singhania", "Sen", "Chopra", "Roy", "Bajaj", "Soni", "Jain", "Saxena",
  "Bansal", "Das", "Varma", "Mehra", "Ahuja", "Sundaram", "Goel", "Shrestha", "Aggarwal", "Kaul",
  "Pandey", "Bose", "Bhatia", "Sinha", "Mazumdar", "Shetty", "Kashyap", "Dutt", "Thakur", "Mishra"
];

const DEPARTMENTS_DATA = [
  { key: "engineering", id: "a93d3fa5-0dde-4535-ac6f-dfd74a012b8c", name: "Engineering" },
  { key: "sales", id: "892eaa08-7cc6-4ad9-80de-de4236026f34", name: "Sales" },
  { key: "hr", id: "fc2b717a-0ea7-4384-aa0b-3c9161f64d6e", name: "Human Resources" },
  { key: "finance", id: "7d25a758-c706-47d3-af21-f4663db4c702", name: "Finance & Payroll" },
  { key: "marketing", id: "da4f7ef6-6910-4cb5-be45-e56e11ccb247", name: "Marketing & Growth" },
  { key: "product", id: "e512a8bc-1234-4567-890a-bcdef1234567", name: "Product & Design" },
  { key: "support", id: "f623b9cd-2345-5678-901b-cdef23456789", name: "Customer Success" },
  { key: "legal", id: "a734caef-3456-6789-012c-defa34567890", name: "Legal & Operations" },
];

const JOB_TITLES_BY_DEPT: Record<string, string[]> = {
  engineering: ["Engineering Lead", "Senior Software Engineer", "Full Stack Developer", "Backend Engineer", "Frontend Developer", "DevOps Engineer", "QA Automation Lead", "Data Engineer", "Cloud Architect", "Systems Analyst"],
  sales: ["VP of Sales", "Enterprise Account Executive", "Sales Operations Manager", "Account Executive", "Business Development Rep", "Pre-Sales Consultant", "Inside Sales Specialist", "Key Account Manager"],
  hr: ["Chief People Officer", "HR Director", "HR Manager", "Talent Acquisition Lead", "HR Business Partner", "Learning & Development Specialist", "People Operations Executive", "HR Coordinator"],
  finance: ["VP of Finance", "Payroll Director", "Payroll Manager", "Senior Financial Analyst", "Payroll Specialist", "Accounts Payable Manager", "Senior Accountant", "Tax & Compliance Specialist"],
  marketing: ["Marketing Director", "Growth Marketing Lead", "Product Marketing Manager", "SEO Specialist", "Content Marketing Manager", "Brand Designer", "Social Media Strategist", "PR Specialist"],
  product: ["Head of Product", "Senior Product Manager", "UI/UX Design Director", "Product Manager", "Lead Product Designer", "UX Researcher", "Product Analyst"],
  support: ["Customer Success Director", "Enterprise Support Manager", "Customer Success Manager", "Technical Support Engineer", "Client Relations Specialist"],
  legal: ["General Counsel", "Legal Operations Manager", "Compliance Officer", "Contracts Administrator", "Operations Specialist"],
};

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

async function main() {
  console.log("🚀 Starting PeoplePay360 High-Performance Seeding (250 Users across 5 Roles)...");

  console.log("🧹 Cleaning up existing data...");
  await prisma.payslipLine.deleteMany({});
  await prisma.payslip.deleteMany({});
  await prisma.payrun.deleteMany({});
  await prisma.timeOffRequest.deleteMany({});
  await prisma.timeOffAllocation.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.contract.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.updateMany({ data: { headEmployeeId: null, parentDepartmentId: null } });
  await prisma.employee.updateMany({ data: { managerId: null, departmentId: null, workingScheduleId: null } });
  await prisma.employee.deleteMany({});

  // ---------- 1. Roles ----------
  const roles: Record<string, string> = {};
  for (const name of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystemRole: true },
    });
    roles[name] = role.id;
  }

  // ---------- 2. Working Schedule ----------
  const schedule = await prisma.workingSchedule.upsert({
    where: { id: "91350275-25e4-4412-96d2-5c3fb25c5825" },
    update: {},
    create: { id: "91350275-25e4-4412-96d2-5c3fb25c5825", name: "Standard 9-to-6 (40h)", type: "full_time", weeklyHours: 40 },
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

  // ---------- 3. Departments ----------
  const deptMap: Record<string, string> = {};
  for (const d of DEPARTMENTS_DATA) {
    const row = await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, name: d.name },
    });
    deptMap[d.key] = row.id;
  }

  // ---------- 4. Salary Structure & Rules ----------
  const structure = await prisma.salaryStructure.upsert({
    where: { id: "85c83b49-19fa-4f52-9f1b-6f3917c09025" },
    update: {},
    create: { id: "85c83b49-19fa-4f52-9f1b-6f3917c09025", name: "Standard Corporate Structure", active: true },
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
    { id: "75c9c5a5-421a-4c62-bee4-e6f618c0474f", name: "Transport Allowance", code: "TRANSPORT", category: "allowance", sequence: 30, computationMethod: "fixed", fixedAmount: 2500 },
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

  // Pre-hash common passwords for fast seeding
  const passwordHashes = {
    admin: await bcrypt.hash("Admin@123", 10),
    manager: await bcrypt.hash("Manager@123", 10),
    payroll: await bcrypt.hash("Payroll@123", 10),
    employee: await bcrypt.hash("Employee@123", 10),
  };

  // ---------- 5. Building 250 Employees & Users ----------
  console.log("Generating 250 employee & user account configurations...");

  interface EmpSeedSpec {
    id: string;
    employeeCode: string;
    name: string;
    email: string;
    role: (typeof ROLE_NAMES)[number];
    deptKey: string;
    jobTitle: string;
    wage: number;
    passwordHash: string;
  }

  const seededEmployees: EmpSeedSpec[] = [];
  const deptKeys = DEPARTMENTS_DATA.map((d) => d.key);

  // Core 5 canonical accounts (for direct login testing)
  seededEmployees.push(
    { id: "75131a57-bc3d-4fca-8e4c-a68932394e4c", employeeCode: "EMP-0001", name: "System Administrator", email: "admin@peoplepay360.dev", role: "ADMIN", deptKey: "hr", jobTitle: "Chief Technology Officer", wage: 180000, passwordHash: passwordHashes.admin },
    { id: "20e80ed7-ef86-43bc-93de-03d92adbd425", employeeCode: "EMP-0002", name: "Rahul Verma", email: "hr.manager@peoplepay360.dev", role: "HR_MANAGER", deptKey: "hr", jobTitle: "HR Director", wage: 110000, passwordHash: passwordHashes.manager },
    { id: "33c4e540-13e6-4235-b632-1047724983f6", employeeCode: "EMP-0003", name: "Priya Sharma", email: "payroll.user@peoplepay360.dev", role: "HR_PAYROLL_USER", deptKey: "finance", jobTitle: "Payroll Specialist", wage: 75000, passwordHash: passwordHashes.payroll },
    { id: "b9e12e10-5489-4e08-890e-17e9d0b210b3", employeeCode: "EMP-0004", name: "Ananya Iyer", email: "payroll.manager@peoplepay360.dev", role: "HR_PAYROLL_MANAGER", deptKey: "finance", jobTitle: "Payroll Manager", wage: 125000, passwordHash: passwordHashes.payroll },
    { id: "ebe1e5a7-3853-4eb1-9ae3-52439def3d30", employeeCode: "EMP-0005", name: "Arjun Mehta", email: "employee.demo@peoplepay360.dev", role: "EMPLOYEE", deptKey: "engineering", jobTitle: "Senior Software Engineer", wage: 95000, passwordHash: passwordHashes.employee }
  );

  const roleTargets: Array<{ role: (typeof ROLE_NAMES)[number]; count: number; prefix: string; passHash: string }> = [
    { role: "ADMIN", count: 4, prefix: "admin", passHash: passwordHashes.admin },
    { role: "HR_PAYROLL_MANAGER", count: 9, prefix: "payrollmanager", passHash: passwordHashes.payroll },
    { role: "HR_PAYROLL_USER", count: 14, prefix: "payrolluser", passHash: passwordHashes.payroll },
    { role: "HR_MANAGER", count: 19, prefix: "hrmanager", passHash: passwordHashes.manager },
    { role: "EMPLOYEE", count: 199, prefix: "emp", passHash: passwordHashes.employee },
  ];

  let empCounter = 6;

  for (const t of roleTargets) {
    for (let i = 1; i <= t.count; i++) {
      const fn = FIRST_NAMES[(empCounter * 3) % FIRST_NAMES.length];
      const ln = LAST_NAMES[(empCounter * 7) % LAST_NAMES.length];
      const name = `${fn} ${ln}`;
      const deptKey = deptKeys[empCounter % deptKeys.length];
      const titles = JOB_TITLES_BY_DEPT[deptKey];
      const jobTitle = titles[empCounter % titles.length];
      const employeeCode = `EMP-${String(empCounter).padStart(4, "0")}`;
      const emailNum = String(i).padStart(t.prefix === "emp" ? 3 : 2, "0");
      const email = `${t.prefix}${emailNum}@peoplepay360.dev`;
      
      const isLead = jobTitle.toLowerCase().includes("director") || jobTitle.toLowerCase().includes("head") || jobTitle.toLowerCase().includes("vp") || jobTitle.toLowerCase().includes("cfo") || jobTitle.toLowerCase().includes("cpo") || jobTitle.toLowerCase().includes("cto");
      const isSenior = jobTitle.toLowerCase().includes("senior") || jobTitle.toLowerCase().includes("lead") || jobTitle.toLowerCase().includes("manager");
      const wage = isLead ? 140000 + (empCounter % 40) * 1000 : isSenior ? 85000 + (empCounter % 35) * 1000 : 50000 + (empCounter % 30) * 1000;

      seededEmployees.push({
        id: randomUUID(),
        employeeCode,
        name,
        email,
        role: t.role,
        deptKey,
        jobTitle,
        wage,
        passwordHash: t.passHash,
      });

      empCounter++;
    }
  }

  // Batch insert Employees
  console.log(`Writing ${seededEmployees.length} employees into database...`);
  await prisma.employee.createMany({
    data: seededEmployees.map((emp) => ({
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: emp.name,
      departmentId: deptMap[emp.deptKey],
      jobPosition: emp.jobTitle,
      workingScheduleId: schedule.id,
      status: "active",
    })),
  });

  // Batch insert Users
  console.log(`Writing ${seededEmployees.length} users into database...`);
  const userRecords = seededEmployees.map((emp) => ({
    id: randomUUID(),
    email: emp.email,
    passwordHash: emp.passwordHash,
    employeeId: emp.id,
    isActive: true,
  }));
  await prisma.user.createMany({ data: userRecords });

  // Batch insert UserRoles
  console.log(`Assigning 250 user roles...`);
  const userRoleRecords = userRecords.map((u, idx) => ({
    id: randomUUID(),
    userId: u.id,
    roleId: roles[seededEmployees[idx].role],
  }));
  await prisma.userRole.createMany({ data: userRoleRecords });

  // Update Departments Hierarchy and Heads
  console.log("Linking department hierarchies and assigning heads...");
  const engDeptId = deptMap["engineering"];
  const prodDeptId = deptMap["product"];
  const salesDeptId = deptMap["sales"];
  const supportDeptId = deptMap["support"];
  
  await prisma.department.update({ where: { id: engDeptId }, data: { parentDepartmentId: prodDeptId } });
  await prisma.department.update({ where: { id: supportDeptId }, data: { parentDepartmentId: salesDeptId } });

  for (const deptKey of deptKeys) {
    const deptId = deptMap[deptKey];
    const headEmp = seededEmployees.find(e => e.deptKey === deptKey && (e.jobTitle.includes("Head") || e.jobTitle.includes("Director") || e.jobTitle.includes("VP") || e.jobTitle.includes("Lead") || e.jobTitle.includes("Chief") || e.jobTitle.includes("Manager")));
    if (headEmp) {
      await prisma.department.update({ where: { id: deptId }, data: { headEmployeeId: headEmp.id } });
    }
  }

  console.log("Assigning managers to employees...");
  const updatedDepts = await prisma.department.findMany();
  for (const emp of seededEmployees) {
    const empDeptId = deptMap[emp.deptKey];
    const dept = updatedDepts.find(d => d.id === empDeptId);
    let managerId = null;
    
    if (dept && dept.headEmployeeId) {
       if (dept.headEmployeeId !== emp.id) {
         managerId = dept.headEmployeeId;
       } else if (dept.parentDepartmentId) {
         const parentDept = updatedDepts.find(d => d.id === dept.parentDepartmentId);
         if (parentDept && parentDept.headEmployeeId) {
           managerId = parentDept.headEmployeeId;
         }
       }
    }
    
    if (managerId) {
      await prisma.employee.update({ where: { id: emp.id }, data: { managerId } });
    }
  }

  // ---------- 6. Contracts for all 250 Employees ----------
  console.log("Seeding 250 active employment contracts...");
  const contractRecords = seededEmployees.map((emp) => ({
    id: randomUUID(),
    employeeId: emp.id,
    departmentId: deptMap[emp.deptKey],
    position: emp.jobTitle,
    wage: emp.wage,
    salaryStructureId: structure.id,
    startDate: new Date(Date.UTC(2025, 0, 1)),
    endDate: null,
    status: "active" as const,
  }));
  await prisma.contract.createMany({ data: contractRecords });

  const activeContractMap: Record<string, string> = {};
  for (const c of contractRecords) {
    activeContractMap[c.employeeId] = c.id;
  }

  // ---------- 7. Attendance Logs (22 Weekdays per employee = 5,500 records) ----------
  console.log("Batch seeding 5,500 attendance records across all 250 employees...");
  const weekdays = lastNWeekdays(22);
  const attendanceRecords: Array<{
    id: string;
    employeeId: string;
    checkIn: Date;
    checkOut: Date;
    workedHours: number;
    status: "present" | "late";
  }> = [];

  for (const emp of seededEmployees) {
    for (const [dayIdx, day] of weekdays.entries()) {
      const isLate = (dayIdx + emp.name.length) % 11 === 0;
      const checkIn = new Date(day);
      checkIn.setUTCHours(isLate ? 10 : 9, isLate ? 15 : 0, 0, 0);

      const checkOut = new Date(day);
      checkOut.setUTCHours(18, 0, 0, 0);

      const workedHours = isLate ? 6.75 : 8.0;

      attendanceRecords.push({
        id: randomUUID(),
        employeeId: emp.id,
        checkIn,
        checkOut,
        workedHours,
        status: isLate ? "late" : "present",
      });
    }
  }
  await prisma.attendance.createMany({ data: attendanceRecords });

  // ---------- 8. Time Off Types & Allocations ----------
  console.log("Seeding time off allocations...");
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

  const timeOffAllocations: Array<{
    id: string;
    employeeId: string;
    typeId: string;
    allocated: number;
    taken: number;
    validFrom: Date;
    validTo: Date;
    status: "validate";
  }> = [];

  for (const emp of seededEmployees) {
    for (const t of TIME_OFF_TYPES.filter((type) => type.requiresAllocation)) {
      timeOffAllocations.push({
        id: randomUUID(),
        employeeId: emp.id,
        typeId: t.id,
        allocated: t.allocated,
        taken: 0,
        validFrom: new Date(Date.UTC(2026, 0, 1)),
        validTo: new Date(Date.UTC(2026, 11, 31)),
        status: "validate",
      });
    }
  }
  await prisma.timeOffAllocation.createMany({ data: timeOffAllocations });

  // ---------- 9. Payroll: 3 Monthly Payruns (750 Payslips, 5250 Lines) ----------
  console.log("Batch seeding 3 monthly payruns (750 payslips, 5,250 rule lines)...");

  const PAYRUNS = [
    { id: "7d05eba0-69f9-40ae-9f2b-756500e6c709", monthsAgo: 2, status: "paid" as const },
    { id: "d44ac1dd-8556-40d9-a4e0-5866a0d91410", monthsAgo: 1, status: "validated" as const },
    { id: "d7c12cf8-51eb-4055-b6cf-94439cb8e361", monthsAgo: 0, status: "computed" as const },
  ];

  let payslipSeq = 1;
  const payslipRecords: Array<{
    id: string;
    payslipNumber: string;
    payrunId: string;
    employeeId: string;
    contractId: string;
    workedDays: number;
    basic: number;
    allowances: number;
    deductions: number;
    gross: number;
    net: number;
    status: "paid" | "validated" | "computed";
  }> = [];

  const payslipLineRecords: Array<{
    id: string;
    payslipId: string;
    ruleId: string;
    category: SalaryRuleCategory;
    name: string;
    amount: number;
  }> = [];

  for (const p of PAYRUNS) {
    const { start, end } = monthsAgoRange(p.monthsAgo);

    await prisma.payrun.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        structureId: structure.id,
        periodStart: start,
        periodEnd: end,
        status: p.status,
      },
    });

    for (const emp of seededEmployees) {
      const basic = emp.wage;
      const hra = Math.round(basic * 0.2);
      const transport = 2500;
      const gross = basic + hra + transport;
      const pf = Math.round(basic * 0.12);
      const tax = Math.round(gross * 0.1);
      const net = gross - pf - tax;

      const payslipId = randomUUID();
      const payslipNumber = `PS-2026-${String(payslipSeq++).padStart(6, "0")}`;
      const payslipStatus = p.status === "paid" ? "paid" : p.status === "validated" ? "validated" : "computed";

      payslipRecords.push({
        id: payslipId,
        payslipNumber,
        payrunId: p.id,
        employeeId: emp.id,
        contractId: activeContractMap[emp.id],
        workedDays: 22,
        basic,
        allowances: hra + transport,
        deductions: pf + tax,
        gross,
        net,
        status: payslipStatus,
      });

      const lines = [
        { rule: RULES[0], amount: basic },
        { rule: RULES[1], amount: hra },
        { rule: RULES[2], amount: transport },
        { rule: RULES[3], amount: gross },
        { rule: RULES[4], amount: -pf },
        { rule: RULES[5], amount: -tax },
        { rule: RULES[6], amount: net },
      ];

      for (const line of lines) {
        payslipLineRecords.push({
          id: randomUUID(),
          payslipId,
          ruleId: line.rule.id,
          category: line.rule.category,
          name: line.rule.name,
          amount: line.amount,
        });
      }
    }
  }

  await prisma.payslip.createMany({ data: payslipRecords });
  await prisma.payslipLine.createMany({ data: payslipLineRecords });

  console.log("\n=======================================================");
  console.log("✅ HIGH-PERFORMANCE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=======================================================");
  console.log(`Total Employees Created: ${seededEmployees.length}`);
  console.log(`Total User Accounts:     ${seededEmployees.length}`);
  console.log(`Total Attendance Records: 5,500`);
  console.log(`Total Payruns & Slips:   3 Payruns, 750 Payslips, 5,250 Rule Lines`);
  console.log("-------------------------------------------------------");
  console.log("Role Accounts Summary for Mentor Testing:");
  console.log("  • ADMIN:               5 Accounts (admin@peoplepay360.dev, admin01..04@peoplepay360.dev / Admin@123)");
  console.log("  • HR_MANAGER:          20 Accounts (hr.manager@peoplepay360.dev, hrmanager01..19@peoplepay360.dev / Manager@123)");
  console.log("  • HR_PAYROLL_USER:     15 Accounts (payroll.user@peoplepay360.dev, payrolluser01..14@peoplepay360.dev / Payroll@123)");
  console.log("  • HR_PAYROLL_MANAGER:  10 Accounts (payroll.manager@peoplepay360.dev, payrollmanager01..09@peoplepay360.dev / Payroll@123)");
  console.log("  • EMPLOYEE:            200 Accounts (employee.demo@peoplepay360.dev, emp001..199@peoplepay360.dev / Employee@123)");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
