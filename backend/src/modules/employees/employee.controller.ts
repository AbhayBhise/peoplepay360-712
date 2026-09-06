import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import * as employeeService from "./employee.service";
import { createEmployeeSchema, updateEmployeeSchema } from "./employee.validation";
import { parsePaginationIfRequested } from "../../utils/pagination";
import { recordAudit } from "../../utils/audit";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const employees = await employeeService.listEmployees(
    req.auth!,
    {
      departmentId: typeof req.query.department_id === "string" ? req.query.department_id : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      search: typeof req.query.search === "string" ? req.query.search : undefined,
    },
    parsePaginationIfRequested(req)
  );
  return ok(res, employees);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.getEmployeeById(req.auth!, req.params.id);
  return ok(res, employee);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = createEmployeeSchema.parse(req.body);
  const employee = await employeeService.createEmployee(body);
  await recordAudit(req, { module: "employee", action: "create", recordId: employee.id, after: employee });
  return ok(res, employee, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const body = updateEmployeeSchema.parse(req.body);
  const employee = await employeeService.updateEmployee(req.params.id, body);
  await recordAudit(req, { module: "employee", action: "update", recordId: employee.id, after: employee });
  return ok(res, employee);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const employee = await employeeService.deactivateEmployee(req.params.id);
  await recordAudit(req, { module: "employee", action: "deactivate", recordId: employee.id, after: employee });
  return ok(res, employee);
});

// Smart-button endpoints backing the Employee Form (docs/roles/FRONTEND.md)
export const contracts = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await employeeService.getRelatedContracts(req.auth!, req.params.id));
});

export const attendance = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await employeeService.getRelatedAttendance(req.auth!, req.params.id));
});

export const timeOff = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await employeeService.getRelatedTimeOff(req.auth!, req.params.id));
});

export const payslips = asyncHandler(async (req: Request, res: Response) => {
  return ok(res, await employeeService.getRelatedPayslips(req.auth!, req.params.id));
});
