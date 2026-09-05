import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS, HRPU_PLUS, HRPM_PLUS } from "../../middleware/auth";
import * as payrollController from "./payroll.controller";

export const payrollRouter = Router();

payrollRouter.use(authenticate);

// Salary Structures: the LIST endpoint is HRM+ (not HRPU+ like the rest of this
// resource) because Contract create/edit — an HRM+ permission per the role table —
// requires picking a salary_structure_id (docs/02_API_CONTRACTS.md section 3). HR
// Manager needs to read structure names for that dropdown even though they have no
// other payroll access; the detail/rules endpoints below stay HRPU+ only so the
// actual rule configuration (amounts, formulas) is still payroll-only.
payrollRouter.get("/salary-structures", requireRole(...HRM_PLUS), payrollController.listStructures);
payrollRouter.get("/salary-structures/:id", requireRole(...HRPU_PLUS), payrollController.getStructure);
payrollRouter.post("/salary-structures", requireRole(...HRPM_PLUS), payrollController.createStructure);
payrollRouter.put("/salary-structures/:id", requireRole(...HRPM_PLUS), payrollController.updateStructure);

// Salary Rules: same split — HRPU reads, HRPM+ writes
payrollRouter.get("/salary-structures/:structureId/rules", requireRole(...HRPU_PLUS), payrollController.listRules);
payrollRouter.post("/salary-rules", requireRole(...HRPM_PLUS), payrollController.createRule);
payrollRouter.put("/salary-rules/:id", requireRole(...HRPM_PLUS), payrollController.updateRule);

// Payruns: HRPU+ create/compute/read; HRPM+ validate/mark-paid (maker-checker — see
// docs/roles/DATABASE.md decision log and payrun.service.ts validatePayrun)
payrollRouter.post("/payruns/preview", requireRole(...HRPU_PLUS), payrollController.previewPayrun);
payrollRouter.post("/payruns", requireRole(...HRPU_PLUS), payrollController.createPayrun);
payrollRouter.get("/payruns", requireRole(...HRPU_PLUS), payrollController.listPayruns);
payrollRouter.get("/payruns/:id", requireRole(...HRPU_PLUS), payrollController.getPayrun);
payrollRouter.post("/payruns/:id/compute", requireRole(...HRPU_PLUS), payrollController.computePayrun);
payrollRouter.post("/payruns/:id/validate", requireRole(...HRPM_PLUS), payrollController.validatePayrun);
payrollRouter.post("/payruns/:id/mark-paid", requireRole(...HRPM_PLUS), payrollController.markPayrunPaid);
payrollRouter.post("/payruns/:id/send-payslips", requireRole(...HRPU_PLUS), payrollController.sendPayslips);

// Payslips: HRPU+ see everyone, Employee sees only self (payslip.service.ts)
payrollRouter.get("/payslips", payrollController.listPayslips);
payrollRouter.get("/payslips/:id", payrollController.getPayslip);
payrollRouter.get("/payslips/:id/pdf", payrollController.getPayslipPdf);
