import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { ApiError } from "../../utils/ApiError";
import * as typeService from "./timeOffType.service";
import * as allocationService from "./timeOffAllocation.service";
import * as requestService from "./timeOffRequest.service";
import {
  createTimeOffTypeSchema,
  updateTimeOffTypeSchema,
  createAllocationSchema,
  createRequestSchema,
} from "./timeOff.validation";

// ---- Types ----
export const listTypes = asyncHandler(async (_req: Request, res: Response) => {
  return ok(res, await typeService.listTypes());
});
export const getType = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await typeService.getType(req.params.id));
});
export const createType = asyncHandler(async (req: Request, res: Response) => {
  const body = createTimeOffTypeSchema.parse(req.body);
  return ok(res, await typeService.createType(body), 201);
});
export const updateType = asyncHandler(async (req: Request, res: Response) => {
  const body = updateTimeOffTypeSchema.parse(req.body);
  return ok(res, await typeService.updateType(req.params.id, body));
});

// ---- Allocations ----
export const listAllocations = asyncHandler(async (req: Request, res: Response) => {
  const rows = await allocationService.listAllocations(req.auth!, {
    employeeId: typeof req.query.employee_id === "string" ? req.query.employee_id : undefined,
    typeId: typeof req.query.type_id === "string" ? req.query.type_id : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  return ok(res, rows);
});
export const createAllocation = asyncHandler(async (req: Request, res: Response) => {
  const body = createAllocationSchema.parse(req.body);
  return ok(res, await allocationService.createAllocation(body), 201);
});
export const approveAllocation = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await allocationService.approveAllocation(req.params.id));
});

// ---- Requests ----
export const listRequests = asyncHandler(async (req: Request, res: Response) => {
  const rows = await requestService.listRequests(req.auth!, {
    employeeId: typeof req.query.employee_id === "string" ? req.query.employee_id : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  return ok(res, rows);
});
export const getBalance = asyncHandler(async (req: Request, res: Response) => {
  const { employee_id, type_id } = req.query;
  if (typeof employee_id !== "string" || typeof type_id !== "string") {
    throw ApiError.badRequest("employee_id and type_id query params are required");
  }
  return ok(res, await requestService.getRemainingBalance(employee_id, type_id));
});
export const createRequest = asyncHandler(async (req: Request, res: Response) => {
  const body = createRequestSchema.parse(req.body);
  return ok(res, await requestService.createRequest(req.auth!, body), 201);
});
export const approveRequest = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await requestService.approveRequest(req.params.id));
});
export const refuseRequest = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await requestService.refuseRequest(req.params.id));
});
