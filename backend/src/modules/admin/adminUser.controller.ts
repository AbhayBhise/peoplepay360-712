import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { recordAudit } from "../../utils/audit";
import { parsePaginationIfRequested } from "../../utils/pagination";
import * as adminUserService from "./adminUser.service";
import { createUserSchema, updateUserRolesSchema } from "./adminUser.validation";

export const list = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await adminUserService.listUsers(parsePaginationIfRequested(req)));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body);
  const user = await adminUserService.createUser(req.auth!.userId, body);
  await recordAudit(req, { module: "user_management", action: "create_user", recordId: user.id, after: user });
  return ok(res, user, 201);
});

export const updateRoles = asyncHandler(async (req: Request, res: Response) => {
  const body = updateUserRolesSchema.parse(req.body);
  const user = await adminUserService.updateUserRoles(req.auth!.userId, req.params.id, body);
  await recordAudit(req, { module: "user_management", action: "update_roles", recordId: user.id, after: user });
  return ok(res, user);
});

export const deactivate = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminUserService.setUserActive(req.params.id, false);
  await recordAudit(req, { module: "user_management", action: "deactivate_user", recordId: user.id, after: user });
  return ok(res, user);
});

export const reactivate = asyncHandler(async (req: Request, res: Response) => {
  const user = await adminUserService.setUserActive(req.params.id, true);
  await recordAudit(req, { module: "user_management", action: "reactivate_user", recordId: user.id, after: user });
  return ok(res, user);
});
