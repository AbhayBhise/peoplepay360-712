import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as dashboardController from "./dashboard.controller";

export const dashboardRouter = Router();

// Employee personal dashboard view (accessible to any authenticated role including EMPLOYEE)
dashboardRouter.get("/me", authenticate, dashboardController.me);

// Organization management endpoints (guarded by HRM+)
dashboardRouter.get("/summary", authenticate, requireRole(...HRM_PLUS), dashboardController.summary);
dashboardRouter.get("/salary-by-department", authenticate, requireRole(...HRM_PLUS), dashboardController.salaryByDepartment);
dashboardRouter.get("/net-salary-trend", authenticate, requireRole(...HRM_PLUS), dashboardController.netSalaryTrend);
dashboardRouter.get("/attendance-overview", authenticate, requireRole(...HRM_PLUS), dashboardController.attendanceOverview);
dashboardRouter.get("/alerts", authenticate, requireRole(...HRM_PLUS), dashboardController.alerts);
