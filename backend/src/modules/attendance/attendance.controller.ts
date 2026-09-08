import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as attendanceService from "./attendance.service";
import {
  checkInSchema,
  checkOutSchema,
  correctAttendanceSchema,
  emergencyCheckoutSchema,
  reviewEmergencySchema,
} from "./attendance.validation";
import { parsePaginationIfRequested } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const rows = await attendanceService.listAttendance(
    req.auth!,
    {
      employeeId: typeof req.query.employee_id === "string" ? req.query.employee_id : undefined,
      dateFrom: typeof req.query.date_from === "string" ? new Date(req.query.date_from) : undefined,
      dateTo: typeof req.query.date_to === "string" ? new Date(req.query.date_to) : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
    },
    parsePaginationIfRequested(req)
  );
  return ok(res, rows);
});

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const body = checkInSchema.parse(req.body);
  const row = await attendanceService.checkIn(req.auth!, body);
  return ok(res, row, 201);
});

export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const body = checkOutSchema.parse(req.body);
  const row = await attendanceService.checkOut(req.auth!, req.params.id, body);
  return ok(res, row);
});

export const emergencyCheckout = asyncHandler(async (req: Request, res: Response) => {
  const body = emergencyCheckoutSchema.parse(req.body);
  // req.file is attached by multer middleware in the route
  const row = await attendanceService.emergencyCheckout(
    req.auth!,
    req.params.id,
    body,
    req.file
  );
  return ok(res, row);
});

export const listEmergencies = asyncHandler(async (req: Request, res: Response) => {
  const rows = await attendanceService.listEmergencies(req.auth!);
  return ok(res, rows);
});

export const reviewEmergency = asyncHandler(async (req: Request, res: Response) => {
  const body = reviewEmergencySchema.parse(req.body);
  const row = await attendanceService.reviewEmergency(req.auth!, req.params.id, body);
  return ok(res, row);
});

export const correct = asyncHandler(async (req: Request, res: Response) => {
  const body = correctAttendanceSchema.parse(req.body);
  const row = await attendanceService.correctAttendance(req.params.id, body);
  return ok(res, row);
});

export const shiftWindow = asyncHandler(async (req: Request, res: Response) => {
  const employeeId = typeof req.query.employee_id === "string" ? req.query.employee_id : req.auth!.employeeId ?? "";
  const window = await attendanceService.getShiftWindow(req.auth!, employeeId);
  return ok(res, window);
});
