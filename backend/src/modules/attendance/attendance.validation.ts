import { z } from "zod";

export const checkInSchema = z.object({
  employeeId: z.string().min(1, { message: "is required" }),
  checkIn: z.coerce.date().optional(),
});

export const checkOutSchema = z.object({
  checkOut: z.coerce.date().optional(),
});

export const correctAttendanceSchema = z.object({
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional().nullable(),
  status: z.enum(["present", "late", "absent", "manual_edit"]).optional(),
});
