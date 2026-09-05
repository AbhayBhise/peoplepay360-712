import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS, HRPU_PLUS } from "../../middleware/auth";
import * as dashboardController from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// Every authenticated user (including plain Employee, who is blocked from everything
// below) gets their own personal dashboard — see dashboard.service.ts getMyDashboard.
dashboardRouter.get("/me", dashboardController.myDashboard);

// Revised decision, replacing the earlier "one shared endpoint set" call: HR Manager
// DOES get /summary and /attendance-overview and /alerts (attendance/leave are HR's
// job), but /summary strips payroll financial fields for them at the service layer
// (dashboard.service.ts getSummary's canSeePayroll flag) — matching the problem
// statement's role table ("HR Manager: ...no access to payroll features") for real,
// not just hidden by the frontend. The two purely financial endpoints
// (salary-by-department, net-salary-trend) are blocked from HR Manager entirely.
dashboardRouter.get("/summary", requireRole(...HRM_PLUS), dashboardController.summary);
dashboardRouter.get("/attendance-overview", requireRole(...HRM_PLUS), dashboardController.attendanceOverview);
dashboardRouter.get("/alerts", requireRole(...HRM_PLUS), dashboardController.alerts);

dashboardRouter.get("/salary-by-department", requireRole(...HRPU_PLUS), dashboardController.salaryByDepartment);
dashboardRouter.get("/net-salary-trend", requireRole(...HRPU_PLUS), dashboardController.netSalaryTrend);
