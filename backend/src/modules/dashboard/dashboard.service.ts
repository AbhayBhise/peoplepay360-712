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

// canSeePayroll gates the financial fields specifically — HR Manager gets this dashboard
// too (attendance/leave are HR's job), but per the problem statement's role table
// ("HR Manager: ...no access to payroll features"), the money figures must not be in
// their response at all, not just hidden by the frontend.
export async function getSummary(filters: DashboardFilters, canSeePayroll: boolean) {
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

  if (!canSeePayroll) {
    return { approvedTimeOff, attendanceHealthPct: round2(attendanceHealthPct) };
  }

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

// Personal dashboard for any employee — no company financials, only their own data.
// This is what an Employee sees instead of being blocked from the HRM+ endpoints above.
export async function getMyDashboard(employeeId: string) {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [attendanceThisMonth, allocations, recentRequests, recentPayslips] = await Promise.all([
    prisma.attendance.findMany({ where: { employeeId, checkIn: { gte: monthStart } } }),
    prisma.timeOffAllocation.findMany({
      where: { employeeId, status: "validate" },
      include: { type: true },
    }),
    prisma.timeOffRequest.findMany({
      where: { employeeId },
      orderBy: { dateFrom: "desc" },
      take: 5,
      include: { type: true },
    }),
    prisma.payslip.findMany({
      where: { employeeId, status: { in: ["computed", "validated", "paid"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const present = attendanceThisMonth.filter((a) => a.status === "present" || a.status === "late").length;
  const late = attendanceThisMonth.filter((a) => a.status === "late").length;
  const missingCheckouts = attendanceThisMonth.filter((a) => a.checkOut === null).length;

  const leaveBalances = allocations.map((a) => ({
    typeName: a.type.name,
    allocated: Number(a.allocated),
    taken: Number(a.taken),
    remaining: Number(a.allocated) - Number(a.taken),
  }));

  return {
    attendanceThisMonth: { present, late, missingCheckouts, totalDays: attendanceThisMonth.length },
    leaveBalances,
    recentTimeOffRequests: recentRequests.map((r) => ({
      typeName: r.type.name,
      dateFrom: r.dateFrom,
      dateTo: r.dateTo,
      duration: Number(r.duration),
      status: r.status,
    })),
    recentPayslips: recentPayslips.map((p) => ({
      id: p.id,
      net: Number(p.net),
      status: p.status,
      createdAt: p.createdAt,
    })),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
