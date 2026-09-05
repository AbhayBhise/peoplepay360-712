// End-to-end smoke test against a RUNNING server (npm run dev in another terminal) and a
// real database. Walks both demo scenarios from docs/00_PROJECT_BRIEF.md:
//   (a) employee -> contract -> attendance -> payrun -> payslip
//   (b) leave allocation -> request -> approval -> balance deduction
// Creates its own fixtures (department/employees/structure/rules/contract) so it doesn't
// depend on whatever seed data happens to exist — safe to run repeatedly.
//
// Usage:
//   BASE_URL=http://localhost:4000/api ADMIN_EMAIL=admin@peoplepay360.dev \
//   ADMIN_PASSWORD=Admin@123 npx ts-node scripts/e2e-smoke-test.ts
//
// Optional: SECOND_USER_EMAIL / SECOND_USER_PASSWORD — a second HRPM+ account, needed to
// fully exercise the maker-checker validate step (a payrun can't be validated by the same
// user who computed it). Without it, the script only confirms the same-user case is
// correctly REJECTED, and skips the full compute->validate->paid chain.

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4000/api";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@peoplepay360.dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin@123";

let passCount = 0;
let failCount = 0;

function pass(label: string) {
  passCount++;
  console.log(`  OK   ${label}`);
}
function fail(label: string, detail: unknown) {
  failCount++;
  console.error(`  FAIL ${label} — ${JSON.stringify(detail)}`);
}

async function call(
  token: string | null,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

function assert(condition: boolean, label: string, detail: unknown) {
  if (condition) pass(label);
  else fail(label, detail);
}

async function main() {
  console.log(`\nPeoplePay360 E2E smoke test — target: ${BASE_URL}\n`);

  // ---- Auth ----
  console.log("Auth");
  const login = await call(null, "POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  assert(login.status === 200 && login.json?.data?.token, "login as admin", login);
  const token = login.json.data.token as string;

  const me = await call(token, "GET", "/auth/me");
  assert(me.status === 200, "GET /auth/me", me);

  // ---- Fixtures: department, employees, working schedule, salary structure/rules ----
  console.log("\nFixtures");
  const dept = await call(token, "POST", "/departments", { name: `Smoke Test Dept ${Date.now()}` });
  assert(dept.status === 201, "create department", dept);
  const departmentId = dept.json?.data?.id;

  const emp1 = await call(token, "POST", "/employees", {
    name: "Smoke Employee One",
    departmentId,
    jobPosition: "QA",
    status: "active",
  });
  assert(emp1.status === 201, "create employee 1", emp1);
  const employee1Id = emp1.json?.data?.id;

  const emp2 = await call(token, "POST", "/employees", {
    name: "Smoke Employee Two",
    departmentId,
    jobPosition: "QA",
    status: "active",
  });
  assert(emp2.status === 201, "create employee 2", emp2);
  const employee2Id = emp2.json?.data?.id;

  const structure = await call(token, "POST", "/salary-structures", { name: `Smoke Structure ${Date.now()}` });
  assert(structure.status === 201, "create salary structure", structure);
  const structureId = structure.json?.data?.id;

  const basicRule = await call(token, "POST", "/salary-rules", {
    structureId,
    name: "Basic",
    code: "BASIC",
    category: "basic",
    sequence: 1,
    computationMethod: "formula",
    formula: "WAGE",
  });
  assert(basicRule.status === 201, "create BASIC rule (formula: WAGE)", basicRule);

  const hraRule = await call(token, "POST", "/salary-rules", {
    structureId,
    name: "HRA",
    code: "HRA",
    category: "allowance",
    sequence: 2,
    computationMethod: "percentage",
    percentage: 20,
    baseField: "BASIC",
  });
  assert(hraRule.status === 201, "create HRA rule (20% of BASIC)", hraRule);

  const pfRule = await call(token, "POST", "/salary-rules", {
    structureId,
    name: "Provident Fund",
    code: "PF",
    category: "deduction",
    sequence: 3,
    computationMethod: "percentage",
    percentage: 12,
    baseField: "BASIC",
  });
  assert(pfRule.status === 201, "create PF deduction rule (12% of BASIC)", pfRule);

  // ---- Contracts covering a fixed test period ----
  const periodStart = "2026-08-01";
  const periodEnd = "2026-08-31";
  const contractStart = "2026-01-01";

  const contract1 = await call(token, "POST", "/contracts", {
    employeeId: employee1Id,
    departmentId,
    position: "QA Engineer",
    wage: 50000,
    salaryStructureId: structureId,
    startDate: contractStart,
    status: "active",
  });
  assert(contract1.status === 201, "create active contract for employee 1", contract1);

  const contract2 = await call(token, "POST", "/contracts", {
    employeeId: employee2Id,
    departmentId,
    position: "QA Engineer",
    wage: 60000,
    salaryStructureId: structureId,
    startDate: contractStart,
    status: "active",
  });
  assert(contract2.status === 201, "create active contract for employee 2", contract2);

  // Overlap rejection check — same employee, overlapping active contract must fail.
  const overlap = await call(token, "POST", "/contracts", {
    employeeId: employee1Id,
    wage: 99999,
    startDate: "2026-06-01",
    status: "active",
  });
  assert(overlap.status === 409, "reject overlapping active contract", overlap);

  // ---- Attendance ----
  console.log("\nAttendance");
  const checkIn = await call(token, "POST", "/attendance/check-in", {
    employeeId: employee1Id,
    checkIn: "2026-08-05T09:00:00.000Z",
  });
  assert(checkIn.status === 201, "check-in employee 1", checkIn);
  const attendanceId = checkIn.json?.data?.id;

  const checkOut = await call(token, "POST", `/attendance/${attendanceId}/check-out`, {
    checkOut: "2026-08-05T09:01:00.000Z",
  });
  assert(checkOut.status === 200 && Number(checkOut.json?.data?.workedHours) > 0, "check-out computes workedHours", checkOut);

  // ---- Time Off: allocation -> approve -> balance -> request -> approve -> balance again ----
  console.log("\nTime Off");
  const leaveType = await call(token, "POST", "/time-off/types", {
    name: `Smoke Leave ${Date.now()}`,
    unit: "days",
    requiresAllocation: true,
  });
  assert(leaveType.status === 201, "create time off type", leaveType);
  const typeId = leaveType.json?.data?.id;

  const allocation = await call(token, "POST", "/time-off/allocations", {
    employeeId: employee1Id,
    typeId,
    allocated: 10,
    validFrom: "2026-01-01",
  });
  assert(allocation.status === 201, "create allocation (10 days)", allocation);
  const allocationId = allocation.json?.data?.id;

  const approveAllocation = await call(token, "POST", `/time-off/allocations/${allocationId}/approve`);
  assert(approveAllocation.status === 200, "approve allocation", approveAllocation);

  const balanceBefore = await call(token, "GET", `/time-off/requests/balance?employee_id=${employee1Id}&type_id=${typeId}`);
  assert(balanceBefore.json?.data?.remaining === 10, "balance before request = 10", balanceBefore);

  const request = await call(token, "POST", "/time-off/requests", {
    employeeId: employee1Id,
    typeId,
    dateFrom: "2026-08-10", // Monday
    dateTo: "2026-08-11", // Tuesday — 2 weekdays
  });
  assert(request.status === 201 && Number(request.json?.data?.duration) === 2, "create request, duration=2 weekdays", request);
  const requestId = request.json?.data?.id;

  const approveRequest = await call(token, "POST", `/time-off/requests/${requestId}/approve`);
  assert(approveRequest.status === 200, "approve request (atomic balance deduction)", approveRequest);

  const balanceAfter = await call(token, "GET", `/time-off/requests/balance?employee_id=${employee1Id}&type_id=${typeId}`);
  assert(balanceAfter.json?.data?.remaining === 8, "balance after approval = 8 (10 - 2)", balanceAfter);

  // Over-limit request must be rejected.
  const overLimit = await call(token, "POST", "/time-off/requests", {
    employeeId: employee1Id,
    typeId,
    dateFrom: "2026-08-17",
    dateTo: "2026-08-28", // 10 weekdays, only 8 remain
  });
  assert(overLimit.status === 409, "reject request exceeding remaining balance", overLimit);

  // ---- Payroll: preview -> create -> compute -> validate (maker-checker) -> pdf/email ----
  console.log("\nPayroll");
  const preview = await call(token, "POST", "/payruns/preview", { structureId, periodStart, periodEnd });
  const eligibleIds = (preview.json?.data ?? []).map((e: any) => e.employeeId);
  assert(
    preview.status === 200 && eligibleIds.includes(employee1Id) && eligibleIds.includes(employee2Id),
    "preview finds both employees eligible",
    preview
  );

  const payrun = await call(token, "POST", "/payruns", {
    structureId,
    periodStart,
    periodEnd,
    employeeIds: [employee1Id, employee2Id],
  });
  assert(payrun.status === 201, "create payrun with both employees", payrun);
  const payrunId = payrun.json?.data?.id;

  const compute = await call(token, "POST", `/payruns/${payrunId}/compute`);
  assert(compute.status === 200 && compute.json?.data?.status === "computed", "compute payrun", compute);

  const payslips = await call(token, "GET", `/payslips?payrun_id=${payrunId}`);
  const emp1Payslip = (payslips.json?.data ?? []).find((p: any) => p.employeeId === employee1Id);
  assert(
    payslips.status === 200 && emp1Payslip && Number(emp1Payslip.net) > 0,
    "employee 1 payslip has positive net pay",
    payslips
  );
  assert(
    emp1Payslip && Math.abs(Number(emp1Payslip.basic) - 50000) < 0.01,
    "employee 1 BASIC resolved from contract WAGE (50000)",
    emp1Payslip
  );
  assert(
    emp1Payslip && Math.abs(Number(emp1Payslip.gross) - Number(emp1Payslip.basic) - Number(emp1Payslip.allowances)) < 0.01,
    "gross = basic + allowances",
    emp1Payslip
  );
  assert(
    emp1Payslip && Math.abs(Number(emp1Payslip.net) - (Number(emp1Payslip.gross) - Number(emp1Payslip.deductions))) < 0.01,
    "net = gross - deductions",
    emp1Payslip
  );

  // Same user validating what they computed must be rejected (maker-checker).
  const selfValidate = await call(token, "POST", `/payruns/${payrunId}/validate`);
  assert(selfValidate.status === 403, "reject validate by the same user who computed", selfValidate);

  const secondEmail = process.env.SECOND_USER_EMAIL;
  const secondPassword = process.env.SECOND_USER_PASSWORD;
  if (secondEmail && secondPassword) {
    const secondLogin = await call(null, "POST", "/auth/login", { email: secondEmail, password: secondPassword });
    const secondToken = secondLogin.json?.data?.token;
    assert(secondLogin.status === 200 && secondToken, "login as second HRPM+ user", secondLogin);

    const validate = await call(secondToken, "POST", `/payruns/${payrunId}/validate`);
    assert(validate.status === 200 && validate.json?.data?.status === "validated", "validate with a different user", validate);

    const markPaid = await call(secondToken, "POST", `/payruns/${payrunId}/mark-paid`);
    assert(markPaid.status === 200, "mark payrun paid", markPaid);

    const pdf = await fetch(`${BASE_URL}/payslips/${emp1Payslip.id}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const pdfBuffer = Buffer.from(await pdf.arrayBuffer());
    assert(
      pdf.status === 200 && pdfBuffer.subarray(0, 5).toString("ascii") === "%PDF-",
      "GET payslip PDF returns a real PDF",
      { status: pdf.status, len: pdfBuffer.length }
    );

    const sendResult = await call(token, "POST", `/payruns/${payrunId}/send-payslips`);
    assert(sendResult.status === 200, "send-payslips endpoint responds", sendResult);
    console.log(`  INFO send-payslips result: ${JSON.stringify(sendResult.json?.data)}`);
  } else {
    console.log(
      "  SKIP full validate/mark-paid/pdf/send chain — set SECOND_USER_EMAIL/SECOND_USER_PASSWORD (a second HRPM+ account) to test it."
    );
  }

  // ---- Dashboard ----
  console.log("\nDashboard");
  const summary = await call(token, "GET", `/dashboard/summary?department_id=${departmentId}`);
  assert(summary.status === 200, "GET dashboard summary", summary);

  const salaryByDept = await call(token, "GET", "/dashboard/salary-by-department");
  assert(salaryByDept.status === 200, "GET salary-by-department", salaryByDept);

  console.log(`\n${passCount} passed, ${failCount} failed\n`);
  process.exitCode = failCount > 0 ? 1 : 0;
}

main().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exitCode = 1;
});
