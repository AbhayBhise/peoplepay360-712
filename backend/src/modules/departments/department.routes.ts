import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as departmentController from "./department.controller";

export const departmentRouter = Router();

departmentRouter.use(authenticate);

// Read: HRM+ (tightened from open authenticated)
departmentRouter.get("/", requireRole(...HRM_PLUS), departmentController.list);
departmentRouter.get("/:id", requireRole(...HRM_PLUS), departmentController.getById);

// Write: HRM+
departmentRouter.post("/", requireRole(...HRM_PLUS), departmentController.create);
departmentRouter.put("/:id", requireRole(...HRM_PLUS), departmentController.update);
departmentRouter.delete("/:id", requireRole(...HRM_PLUS), departmentController.remove);
