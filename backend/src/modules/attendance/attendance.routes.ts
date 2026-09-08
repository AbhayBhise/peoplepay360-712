import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import { uploadEvidence } from "../../utils/upload";
import * as attendanceController from "./attendance.controller";

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

// Read: HRM+ see everyone, Employee sees only self (attendance.service.ts)
attendanceRouter.get("/", attendanceController.list);

// Shift window query — frontend uses this to show/hide check-in button without a wasted API round-trip
attendanceRouter.get("/shift-window", attendanceController.shiftWindow);

// Emergency checkout list — HRM+ only, shows all pending/reviewed emergencies
attendanceRouter.get("/emergency", requireRole(...HRM_PLUS), attendanceController.listEmergencies);

// Check-in/out: self or HRM+ (on behalf of, for backfill) — enforced in the service layer
attendanceRouter.post("/check-in", attendanceController.checkIn);
attendanceRouter.post("/:id/check-out", attendanceController.checkOut);

// Emergency checkout: self or HRM+ — multipart/form-data with optional evidence file
attendanceRouter.post(
  "/:id/emergency-checkout",
  uploadEvidence.single("evidence"),
  attendanceController.emergencyCheckout
);

// HRM+ review: approve or reject an emergency checkout
attendanceRouter.post(
  "/:id/emergency-review",
  requireRole(...HRM_PLUS),
  attendanceController.reviewEmergency
);

// Corrections: HRM+ only (docs/roles/FRONTEND.md — employees cannot edit past records)
attendanceRouter.put("/:id", requireRole(...HRM_PLUS), attendanceController.correct);
