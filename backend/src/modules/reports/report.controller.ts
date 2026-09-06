import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { DashboardFilters } from "../dashboard/dashboard.service";
import { buildPayrollReport, renderPayrollReportCsv } from "./report.service";
import { generatePayrollReportPdf } from "./reportPdf";

function parseFilters(req: Request): DashboardFilters {
  const q = req.query;
  return {
    periodStart: typeof q.period_start === "string" ? new Date(q.period_start) : undefined,
    periodEnd: typeof q.period_end === "string" ? new Date(q.period_end) : undefined,
    departmentId: typeof q.department_id === "string" ? q.department_id : undefined,
    employeeType: typeof q.employee_type === "string" ? q.employee_type : undefined,
  };
}

function fileStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export const payrollReportPdf = asyncHandler(async (req: Request, res: Response) => {
  const data = await buildPayrollReport(parseFilters(req), req.auth!.userId);
  const pdf = await generatePayrollReportPdf(data);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", pdf.length);
  // `inline` so a browser tab renders it directly — the download button on the
  // frontend can still force a save with the download attribute.
  res.setHeader("Content-Disposition", `inline; filename="payroll-report-${fileStamp()}.pdf"`);
  return res.send(pdf);
});

export const payrollReportCsv = asyncHandler(async (req: Request, res: Response) => {
  const data = await buildPayrollReport(parseFilters(req), req.auth!.userId);
  const csv = renderPayrollReportCsv(data);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="payroll-report-${fileStamp()}.csv"`);
  // BOM so Excel opens UTF-8 correctly instead of mangling non-ASCII names.
  return res.send("﻿" + csv);
});
