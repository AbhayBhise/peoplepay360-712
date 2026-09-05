import { Router } from "express";
import { authenticate, requireRole, HRM_PLUS } from "../../middleware/auth";
import * as attendanceController from "./attendance.controller";

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

// Read: HRM+ see everyone, Employee sees only self (attendance.service.ts)
attendanceRouter.get("/", attendanceController.list);

// Check-in/out: self or HRM+ (on behalf of, for backfill) — enforced in the service layer
attendanceRouter.post("/check-in", attendanceController.checkIn);
attendanceRouter.post("/:id/check-out", attendanceController.checkOut);

// Corrections: HRM+ only (docs/roles/FRONTEND.md — employees cannot edit past records)
attendanceRouter.put("/:id", requireRole(...HRM_PLUS), attendanceController.correct);
