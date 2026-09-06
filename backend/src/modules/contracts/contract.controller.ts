import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as contractService from "./contract.service";
import { createContractSchema, updateContractSchema } from "./contract.validation";
import { parsePaginationIfRequested } from "../../utils/pagination";
import { recordAudit } from "../../utils/audit";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const contracts = await contractService.listContracts(
    req.auth!,
    {
      employeeId: typeof req.query.employee_id === "string" ? req.query.employee_id : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
    },
    parsePaginationIfRequested(req)
  );
  return ok(res, contracts);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const contract = await contractService.getContract(req.auth!, req.params.id);
  return ok(res, contract);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createContractSchema.parse(req.body);
  const contract = await contractService.createContract(body);
  await recordAudit(req, { module: "contract", action: "create", recordId: contract.id, after: contract });
  return ok(res, contract, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = updateContractSchema.parse(req.body);
  const contract = await contractService.updateContract(req.params.id, body);
  await recordAudit(req, { module: "contract", action: "update", recordId: contract.id, after: contract });
  return ok(res, contract);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await contractService.deleteContract(req.params.id);
  await recordAudit(req, { module: "contract", action: "delete", recordId: req.params.id });
  return ok(res, { id: req.params.id, deleted: true });
});
