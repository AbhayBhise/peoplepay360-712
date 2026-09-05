import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { departmentRouter } from "../modules/departments/department.routes";
import { employeeRouter } from "../modules/employees/employee.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/departments", departmentRouter);
apiRouter.use("/employees", employeeRouter);

// Contracts, Attendance, Time Off, Salary Structures/Rules, Payruns, Payslips, Dashboard
// are separate modules per docs/02_API_CONTRACTS.md — add their routers here as those
// feature branches land (feat/backend-contracts, feat/backend-attendance, etc.).
