import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as employeeController from "./employee.controller";

export const employeeRouter = Router();

employeeRouter.use(authenticate);

// List/detail: HRM+ see everyone, Employee sees only self — enforced in employee.service.ts,
// not here, so it can't be bypassed by hitting the route with a different role check missing.
employeeRouter.get("/", employeeController.list);
employeeRouter.get("/:id", employeeController.getById);
employeeRouter.get("/:id/contracts", employeeController.contracts);
employeeRouter.get("/:id/attendance", employeeController.attendance);
employeeRouter.get("/:id/time-off", employeeController.timeOff);
employeeRouter.get("/:id/payslips", employeeController.payslips);

// Write: HRM+ only (docs/02_API_CONTRACTS.md section 2)
employeeRouter.post("/", requireRole(...HRM_PLUS), employeeController.create);
employeeRouter.put("/:id", requireRole(...HRM_PLUS), employeeController.update);

// Delete (soft): Admin only
employeeRouter.delete("/:id", requireRole("ADMIN"), employeeController.remove);
