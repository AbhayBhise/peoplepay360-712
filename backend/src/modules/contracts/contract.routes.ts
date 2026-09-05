import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as contractController from "./contract.controller";

export const contractRouter = Router();

contractRouter.use(authenticate);

// Read: HRM+ see everyone, Employee sees only own contracts (enforced in contract.service.ts)
contractRouter.get("/", contractController.list);
contractRouter.get("/:id", contractController.getById);

// Write: HRM+ (HR Payroll User/Manager inherit HR Manager's permissions per the problem
// statement's role table — docs/00_PROJECT_BRIEF.md)
contractRouter.post("/", requireRole(...HRM_PLUS), contractController.create);
contractRouter.put("/:id", requireRole(...HRM_PLUS), contractController.update);

// Delete: Admin only, and only if never referenced by a payslip (contract.service.ts)
contractRouter.delete("/:id", requireRole("ADMIN"), contractController.remove);
