import { prisma } from "../../prisma";

export interface DashboardFilters {
  periodStart?: Date;
  periodEnd?: Date;
  departmentId?: string;
  // employeeType: the problem statement mentions filtering by employee type (e.g.
  // full-time/contract), but no such field exists on Employee/Contract yet — accepted
  // here for forward compatibility but currently a no-op. Add an `employmentType`
  // column via a migration before wiring this up for real.
  employeeType?: string;
}

// All queries here are real aggregates against live tables, computed on every request —
// per docs/00_PROJECT_BRIEF.md ("Payroll Dashboard must reflect real-time, live data...
// instead of relying on static charts"), never a cached/precomputed payload.

function payslipWhere(filters: DashboardFilters) {
  return {
    employee: filters.departmentId ? { departmentId: filters.departmentId } : undefined,
    payrun:
      filters.periodStart || filters.periodEnd
        ? {
            periodStart: filters.periodEnd ? { lte: filters.periodEnd } : undefined,
            periodEnd: filters.periodStart ? { gte: filters.periodStart } : undefined,
          }
        : undefined,
  };
}

function attendanceWhere(filters: DashboardFilters) {
  return {
    employee: filters.departmentId ? { departmentId: filters.departmentId } : undefined,
    checkIn:
      filters.periodStart || filters.periodEnd
        ? { gte: filters.periodStart, lte: filters.periodEnd }
        : undefined,
  };
}

export async function getSummary(filters: DashboardFilters) {
  const paidPayslips = await prisma.payslip.findMany({
    where: { ...payslipWhere(filters), status: "paid" },
    select: { net: true },
  });
  const computedOrBeyond = await prisma.payslip.findMany({
    where: { ...payslipWhere(filters), status: { in: ["computed", "validated", "paid"] } },
    select: { net: true },
  });

  const totalNetPaid = paidPayslips.reduce((sum, p) => sum + Number(p.net), 0);
  const payslipsGenerated = computedOrBeyond.length;
  const averageSalary =
    computedOrBeyond.length > 0
      ? computedOrBeyond.reduce((sum, p) => sum + Number(p.net), 0) / computedOrBeyond.length
      : 0;

  const approvedTimeOff = await prisma.timeOffRequest.count({
    where: {
      status: "validate",
      employee: filters.departmentId ? { departmentId: filters.departmentId } : undefined,
      dateFrom: filters.periodStart || filters.periodEnd ? { gte: filters.periodStart, lte: filters.periodEnd } : undefined,
    },
  });

  const totalAttendance = await prisma.attendance.count({ where: attendanceWhere(filters) });
  const presentAttendance = await prisma.attendance.count({
    where: { ...attendanceWhere(filters), status: { in: ["present", "late"] } },
  });
  const attendanceHealthPct = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;

  return {
    totalNetPaid: round2(totalNetPaid),
    payslipsGenerated,
    averageSalary: round2(averageSalary),
    approvedTimeOff,
    attendanceHealthPct: round2(attendanceHealthPct),
  };
}

export async function getSalaryByDepartment(filters: DashboardFilters) {
  const departments = await prisma.department.findMany({
    where: filters.departmentId ? { id: filters.departmentId } : undefined,
    include: { employees: { select: { id: true } } },
  });

  return Promise.all(
    departments.map(async (dept) => {
      const payslips = await prisma.payslip.findMany({
        where: {
          employee: { departmentId: dept.id },
          status: { in: ["computed", "validated", "paid"] },
          payrun:
            filters.periodStart || filters.periodEnd
              ? {
                  periodStart: filters.periodEnd ? { lte: filters.periodEnd } : undefined,
                  periodEnd: filters.periodStart ? { gte: filters.periodStart } : undefined,
                }
              : undefined,
        },
        select: { net: true },
      });
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        headcount: dept.employees.length,
        totalSalary: round2(payslips.reduce((sum, p) => sum + Number(p.net), 0)),
      };
    })
  );
}

export async function getNetSalaryTrend(filters: DashboardFilters) {
  const payslips = await prisma.payslip.findMany({
    where: { ...payslipWhere(filters), status: { in: ["computed", "validated", "paid"] } },
    include: { payrun: { select: { periodStart: true } } },
  });

  const byMonth = new Map<string, number>();
  for (const p of payslips) {
    const month = p.payrun.periodStart.toISOString().slice(0, 7); // YYYY-MM
    byMonth.set(month, (byMonth.get(month) ?? 0) + Number(p.net));
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, netTotal]) => ({ month, netTotal: round2(netTotal) }));
}

export async function getAttendanceOverview(filters: DashboardFilters) {
  const where = attendanceWhere(filters);
  const [present, late, absent, manualEdits, missingCheckouts, total] = await Promise.all([
    prisma.attendance.count({ where: { ...where, status: "present" } }),
    prisma.attendance.count({ where: { ...where, status: "late" } }),
    prisma.attendance.count({ where: { ...where, status: "absent" } }),
    prisma.attendance.count({ where: { ...where, status: "manual_edit" } }),
    prisma.attendance.count({ where: { ...where, checkOut: null } }),
    prisma.attendance.count({ where }),
  ]);

  return {
    present,
    late,
    absent,
    manualEdits,
    missingCheckouts,
    coveragePct: total > 0 ? round2(((total - absent) / total) * 100) : 0,
  };
}

export async function getAlerts(filters: DashboardFilters) {
  const alerts: string[] = [];

  // Payrun status alerts are batch-level, not department-scoped — a payrun spans whichever
  // employees were selected into it, so a department filter doesn't cleanly apply here.
  const attentionPayruns = await prisma.payrun.findMany({
    where: { status: { in: ["draft", "computed"] } },
  });
  for (const run of attentionPayruns) {
    alerts.push(`Payrun ${run.id} is still '${run.status}' — needs compute/validate/mark-paid.`);
  }

  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const expiringContracts = await prisma.contract.findMany({
    where: {
      status: "active",
      endDate: { not: null, lte: soon },
      department: filters.departmentId ? { id: filters.departmentId } : undefined,
    },
    include: { employee: true },
  });
  for (const c of expiringContracts) {
    alerts.push(`Contract for ${c.employee.name} ends ${c.endDate?.toISOString().slice(0, 10)} — needs renewal or offboarding.`);
  }

  // Duplicate payslips (same employee + payrun) are structurally impossible — enforced by
  // the unique(payrunId, employeeId) DB constraint (docs/01_DATABASE_SCHEMA.md) — no
  // runtime check needed here.

  return alerts;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
