import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as timeOffController from "./timeOff.controller";

export const timeOffRouter = Router();

timeOffRouter.use(authenticate);

// Types: read = any authenticated, write = HRM+
timeOffRouter.get("/types", timeOffController.listTypes);
timeOffRouter.get("/types/:id", timeOffController.getType);
timeOffRouter.post("/types", requireRole(...HRM_PLUS), timeOffController.createType);
timeOffRouter.put("/types/:id", requireRole(...HRM_PLUS), timeOffController.updateType);

// Allocations: HRM+ manage; read visibility (self vs all) enforced in the service layer
timeOffRouter.get("/allocations", timeOffController.listAllocations);
timeOffRouter.post("/allocations", requireRole(...HRM_PLUS), timeOffController.createAllocation);
timeOffRouter.post("/allocations/:id/approve", requireRole(...HRM_PLUS), timeOffController.approveAllocation);

// Requests: self or HRM+ can create (service enforces); approve/refuse is HRM+ only
// (Time Off approval is an HR function per the problem statement's role table, not
// automatically granted to HRPU/HRPM beyond what HR Manager already has).
timeOffRouter.get("/requests", timeOffController.listRequests);
timeOffRouter.get("/requests/balance", timeOffController.getBalance);
timeOffRouter.post("/requests", timeOffController.createRequest);
timeOffRouter.post("/requests/:id/approve", requireRole(...HRM_PLUS), timeOffController.approveRequest);
timeOffRouter.post("/requests/:id/refuse", requireRole(...HRM_PLUS), timeOffController.refuseRequest);
