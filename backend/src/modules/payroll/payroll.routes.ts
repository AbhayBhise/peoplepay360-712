import { Router } from "express";
import { authenticate, requireRole, HRPU_PLUS, HRPM_PLUS } from "../../middleware/auth";
import * as payrollController from "./payroll.controller";

export const payrollRouter = Router();

payrollRouter.use(authenticate);

// Salary Structures: HRPU reads, HRPM+ writes (HRPU is explicitly read-only per the
// problem statement's role table — docs/00_PROJECT_BRIEF.md)
payrollRouter.get("/salary-structures", requireRole(...HRPU_PLUS), payrollController.listStructures);
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

// Payslips: HRPU+ see everyone, Employee sees only self (payslip.service.ts)
payrollRouter.get("/payslips", payrollController.listPayslips);
payrollRouter.get("/payslips/:id", payrollController.getPayslip);
