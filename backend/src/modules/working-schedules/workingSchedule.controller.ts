import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as workingScheduleService from "./workingSchedule.service";
import { createWorkingScheduleSchema, updateWorkingScheduleSchema } from "./workingSchedule.validation";

import { parsePaginationIfRequested } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const schedules = await workingScheduleService.listWorkingSchedules(parsePaginationIfRequested(req));
  return ok(res, schedules);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await workingScheduleService.getWorkingSchedule(req.params.id);
  return ok(res, schedule);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createWorkingScheduleSchema.parse(req.body);
  const schedule = await workingScheduleService.createWorkingSchedule(body);
  return ok(res, schedule, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = updateWorkingScheduleSchema.parse(req.body);
  const schedule = await workingScheduleService.updateWorkingSchedule(req.params.id, body);
  return ok(res, schedule);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await workingScheduleService.deleteWorkingSchedule(req.params.id);
  return ok(res, { id: req.params.id, deleted: true });
});
