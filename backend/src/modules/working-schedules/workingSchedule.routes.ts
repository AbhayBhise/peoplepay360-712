import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as workingScheduleController from "./workingSchedule.controller";

export const workingScheduleRouter = Router();

workingScheduleRouter.use(authenticate);

// Read: HRM+ (tightened from open authenticated)
workingScheduleRouter.get("/", requireRole(...HRM_PLUS), workingScheduleController.list);
workingScheduleRouter.get("/:id", requireRole(...HRM_PLUS), workingScheduleController.getById);

// Write: HRM+
workingScheduleRouter.post("/", requireRole(...HRM_PLUS), workingScheduleController.create);
workingScheduleRouter.put("/:id", requireRole(...HRM_PLUS), workingScheduleController.update);
workingScheduleRouter.delete("/:id", requireRole(...HRM_PLUS), workingScheduleController.remove);
