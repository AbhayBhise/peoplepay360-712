import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { departmentRouter } from "../modules/departments/department.routes";
import { employeeRouter } from "../modules/employees/employee.routes";
import { contractRouter } from "../modules/contracts/contract.routes";
import { workingScheduleRouter } from "../modules/working-schedules/workingSchedule.routes";
import { attendanceRouter } from "../modules/attendance/attendance.routes";
import { timeOffRouter } from "../modules/time-off/timeOff.routes";
import { payrollRouter } from "../modules/payroll/payroll.routes";
import { dashboardRouter } from "../modules/dashboard/dashboard.routes";
import { adminRouter } from "../modules/admin/admin.routes";
import { reportRouter } from "../modules/reports/report.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/departments", departmentRouter);
apiRouter.use("/employees", employeeRouter);
apiRouter.use("/contracts", contractRouter);
apiRouter.use("/working-schedules", workingScheduleRouter);
apiRouter.use("/attendance", attendanceRouter);
apiRouter.use("/time-off", timeOffRouter);
apiRouter.use("/", payrollRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/reports", reportRouter);

// Every module in docs/02_API_CONTRACTS.md is now implemented, plus Admin user
// management (docs/roles/ARCHITECT.md follow-up — was previously entirely missing).
