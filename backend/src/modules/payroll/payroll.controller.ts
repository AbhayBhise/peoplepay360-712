import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as structureService from "./salaryStructure.service";
import * as payrunService from "./payrun.service";
import * as payslipService from "./payslip.service";
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
} from "./salaryStructure.validation";
import { previewPayrunSchema, createPayrunSchema } from "./payrun.validation";
import { recordAudit } from "../../utils/audit";

// ---- Salary Structures ----
export const listStructures = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await structureService.listStructures());
});
export const getStructure = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await structureService.getStructure(req.params.id));
});
export const createStructure = asyncHandler(async (req: Request, res: Response) => {
  const body = createSalaryStructureSchema.parse(req.body);
  return ok(res, await structureService.createStructure(body), 201);
});
export const updateStructure = asyncHandler(async (req: Request, res: Response) => {
  const body = updateSalaryStructureSchema.parse(req.body);
  return ok(res, await structureService.updateStructure(req.params.id, body));
});

// ---- Salary Rules ----
export const listRules = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await structureService.listRules(req.params.structureId));
});
export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const body = createSalaryRuleSchema.parse(req.body);
  return ok(res, await structureService.createRule(body), 201);
});
export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const body = updateSalaryRuleSchema.parse(req.body);
  return ok(res, await structureService.updateRule(req.params.id, body));
});

// ---- Payruns ----
export const previewPayrun = asyncHandler(async (req: Request, res: Response) => {
  const body = previewPayrunSchema.parse(req.body);
  return ok(res, await payrunService.previewPayrun(body));
});
export const createPayrun = asyncHandler(async (req: Request, res: Response) => {
  const body = createPayrunSchema.parse(req.body);
  return ok(res, await payrunService.createPayrun(req.auth!, body), 201);
});
export const listPayruns = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await payrunService.listPayruns());
});
export const getPayrun = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await payrunService.getPayrun(req.params.id));
});
export const computePayrun = asyncHandler(async (req: Request, res: Response) => {
  const payrun = await payrunService.computePayrun(req.auth!, req.params.id);
  await recordAudit(req, { module: "payrun", action: "compute", recordId: req.params.id, after: { status: payrun.status } });
  return ok(res, payrun);
});
export const validatePayrun = asyncHandler(async (req: Request, res: Response) => {
  const payrun = await payrunService.validatePayrun(req.auth!, req.params.id);
  await recordAudit(req, { module: "payrun", action: "validate", recordId: req.params.id, after: { status: payrun.status } });
  return ok(res, payrun);
});
export const markPayrunPaid = asyncHandler(async (req: Request, res: Response) => {
  await payrunService.markPayrunPaid(req.params.id);
  await recordAudit(req, { module: "payrun", action: "mark_paid", recordId: req.params.id, after: { status: "paid" } });
  return ok(res, { id: req.params.id, status: "paid" });
});
export const sendPayslips = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await payrunService.sendPayslipsForPayrun(req.params.id));
});

// ---- Payslips ----
export const listPayslips = asyncHandler(async (req: Request, res: Response) => {
  const rows = await payslipService.listPayslips(req.auth!, {
    payrunId: typeof req.query.payrun_id === "string" ? req.query.payrun_id : undefined,
    employeeId: typeof req.query.employee_id === "string" ? req.query.employee_id : undefined,
  });
  return ok(res, rows);
});
export const getPayslip = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await payslipService.getPayslip(req.auth!, req.params.id));
});
export const getPayslipPdf = asyncHandler(async (req: Request, res: Response) => {
  const pdf = await payslipService.getPayslipPdfBuffer(req.auth!, req.params.id);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="payslip-${req.params.id}.pdf"`);
  res.send(pdf);
});
