import { Router } from "express";
import { authenticate, requireRole, HRPU_PLUS } from "../../middleware/auth";
import * as reportController from "./report.controller";

export const reportRouter = Router();

// Payroll financials — same gate as the dashboard's financial endpoints, so HR Manager
// cannot export via a report what they're blocked from seeing on screen.
reportRouter.use(authenticate, requireRole(...HRPU_PLUS));

reportRouter.get("/payroll/pdf", reportController.payrollReportPdf);
reportRouter.get("/payroll/csv", reportController.payrollReportCsv);
