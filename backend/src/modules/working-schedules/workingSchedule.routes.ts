import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as workingScheduleController from "./workingSchedule.controller";

export const workingScheduleRouter = Router();

workingScheduleRouter.use(authenticate);

// Read: any authenticated user (docs/02_API_CONTRACTS.md section 4)
workingScheduleRouter.get("/", workingScheduleController.list);
workingScheduleRouter.get("/:id", workingScheduleController.getById);

// Write: HRM+
workingScheduleRouter.post("/", requireRole(...HRM_PLUS), workingScheduleController.create);
workingScheduleRouter.put("/:id", requireRole(...HRM_PLUS), workingScheduleController.update);
workingScheduleRouter.delete("/:id", requireRole(...HRM_PLUS), workingScheduleController.remove);
