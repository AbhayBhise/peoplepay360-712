import { z } from "zod";

// Self-service check-in/check-out never accepts a client-supplied timestamp — an
// employee's own browser clock is not a trustworthy source for "when did you actually
// show up." Server time is the only timestamp recorded here; backdating a punch is only
// possible through correctAttendance, which is HRM+-gated at the route layer.
export const checkInSchema = z.object({
  employeeId: z.string().min(1, { message: "is required" }),
});

export const checkOutSchema = z.object({});

export const correctAttendanceSchema = z.object({
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional().nullable(),
  status: z.enum(["present", "late", "absent", "manual_edit"]).optional(),
});
