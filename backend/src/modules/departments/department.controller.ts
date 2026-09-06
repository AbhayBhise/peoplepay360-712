import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as departmentService from "./department.service";
import { createDepartmentSchema, updateDepartmentSchema } from "./department.validation";

import { parsePaginationIfRequested } from "../../utils/pagination";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const parentId = typeof req.query.parent_id === "string" ? req.query.parent_id : undefined;
  const departments = await departmentService.listDepartments(parentId, parsePaginationIfRequested(req));
  return ok(res, departments);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.getDepartment(req.params.id);
  return ok(res, department);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createDepartmentSchema.parse(req.body);
  const department = await departmentService.createDepartment(body);
  return ok(res, department, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = updateDepartmentSchema.parse(req.body);
  const department = await departmentService.updateDepartment(req.params.id, body);
  return ok(res, department);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentService.deleteDepartment(req.params.id);
  return ok(res, { id: req.params.id, deleted: true });
});
