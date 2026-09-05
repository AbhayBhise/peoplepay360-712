import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as dashboardController from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, requireRole(...HRM_PLUS));

// Decision (docs/02_API_CONTRACTS.md open item, resolved): one shared endpoint set for
// HRM+, no field-splitting between HR-only vs payroll-inclusive KPIs — the dashboard is
// read-only aggregation, splitting it added complexity with no real benefit under a
// 24-hour clock. Revisit if the team wants tighter HR/Payroll separation later.
dashboardRouter.get("/summary", dashboardController.summary);
dashboardRouter.get("/salary-by-department", dashboardController.salaryByDepartment);
dashboardRouter.get("/net-salary-trend", dashboardController.netSalaryTrend);
dashboardRouter.get("/attendance-overview", dashboardController.attendanceOverview);
dashboardRouter.get("/alerts", dashboardController.alerts);
