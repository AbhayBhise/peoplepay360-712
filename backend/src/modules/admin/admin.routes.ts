import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import * as adminUserController from "./adminUser.controller";

export const adminRouter = Router();

// Admin only, every route — "complete system administration" per the problem statement's
// role table. Nothing here is reachable by any other role, including HR Payroll Manager.
adminRouter.use(authenticate, requireRole("ADMIN"));

adminRouter.get("/users", adminUserController.list);
adminRouter.post("/users", adminUserController.create);
adminRouter.put("/users/:id/roles", adminUserController.updateRoles);
adminRouter.post("/users/:id/deactivate", adminUserController.deactivate);
adminRouter.post("/users/:id/reactivate", adminUserController.reactivate);
