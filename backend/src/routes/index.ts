import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { departmentRouter } from "../modules/departments/department.routes";
import { employeeRouter } from "../modules/employees/employee.routes";
import { contractRouter } from "../modules/contracts/contract.routes";
import { workingScheduleRouter } from "../modules/working-schedules/workingSchedule.routes";
import { attendanceRouter } from "../modules/attendance/attendance.routes";
import { timeOffRouter } from "../modules/time-off/timeOff.routes";
import { payrollRouter } from "../modules/payroll/payroll.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/departments", departmentRouter);
apiRouter.use("/employees", employeeRouter);
apiRouter.use("/contracts", contractRouter);
apiRouter.use("/working-schedules", workingScheduleRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/time-off", timeOffRouter);
apiRouter.use("/", payrollRouter);

// Dashboard aggregation endpoints are the one remaining module per docs/02_API_CONTRACTS.md.
