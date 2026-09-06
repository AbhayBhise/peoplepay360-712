import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { ApiError } from "../../utils/ApiError";
import { HRPU_PLUS } from "../../middleware/auth";
import * as dashboardService from "./dashboard.service";
import { DashboardFilters } from "./dashboard.service";

function parseFilters(req: Request): DashboardFilters {
  const q = req.query;
  return {
    periodStart: typeof q.period_start === "string" ? new Date(q.period_start) : undefined,
    periodEnd: typeof q.period_end === "string" ? new Date(q.period_end) : undefined,
    departmentId: typeof q.department_id === "string" ? q.department_id : undefined,
    employeeType: typeof q.employee_type === "string" ? q.employee_type : undefined,
  };
}

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const canSeePayroll = req.auth!.roles.some((r) => (HRPU_PLUS as string[]).includes(r));
  return ok(res, await dashboardService.getSummary(parseFilters(req), canSeePayroll));
});

// Every authenticated user's own view — attendance, leave, and recent payslips for
// themselves only. This is what an Employee (blocked from the HRM+ endpoints above)
// actually lands on, instead of a 403 or a stale mock fallback.
export const myDashboard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth!.employeeId) {
    throw ApiError.badRequest("this account has no linked employee record");
  }
  return ok(res, await dashboardService.getMyDashboard(req.auth!.employeeId));
});

export const salaryByDepartment = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await dashboardService.getSalaryByDepartment(parseFilters(req)));
});

export const netSalaryTrend = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await dashboardService.getNetSalaryTrend(parseFilters(req)));
});

export const attendanceOverview = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await dashboardService.getAttendanceOverview(parseFilters(req)));
});

export const alerts = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await dashboardService.getAlerts(parseFilters(req)));
});
