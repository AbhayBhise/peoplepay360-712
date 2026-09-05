import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../../api/dashboard';
import { departmentsApi } from '../../api/departments';
import {
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
  Department,
  EmployeeDashboard,
} from '../../types';
import { Spinner } from '../../components/common/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

// 5 Dedicated Role Dashboard Views
import { EmployeeDashboardView } from './views/EmployeeDashboardView';
import { HRManagerDashboardView } from './views/HRManagerDashboardView';
import { PayrollUserDashboardView } from './views/PayrollUserDashboardView';
import { PayrollManagerDashboardView } from './views/PayrollManagerDashboardView';
import { AdminDashboardView } from './views/AdminDashboardView';

export type DashboardRoleView = 
  | 'EMPLOYEE'
  | 'HR_MANAGER'
  | 'HR_PAYROLL_USER'
  | 'HR_PAYROLL_MANAGER'
  | 'ADMIN';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salaryByDept, setSalaryByDept] = useState<SalaryByDepartment[]>([]);
  const [netTrend, setNetTrend] = useState<NetSalaryTrend[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverview | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employeeDashboard, setEmployeeDashboard] = useState<EmployeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [employeeType, setEmployeeType] = useState<string>('');

  const { user, isHRMPlus, isHRPUPlus, isHRPMPlus, isAdmin } = useAuth();
  const { error } = useToast();

  // Determine initial role view based on assigned user roles
  const getInitialRoleView = (): DashboardRoleView => {
    const roles = user?.roles || [];
    if (roles.includes('Admin')) return 'ADMIN';
    if (roles.includes('HR Payroll Manager')) return 'HR_PAYROLL_MANAGER';
    if (roles.includes('HR Payroll User')) return 'HR_PAYROLL_USER';
    if (roles.includes('HR Manager')) return 'HR_MANAGER';
    return 'EMPLOYEE';
  };

  const activeRoleView = getInitialRoleView();

  const loadDashboard = async () => {
    setLoading(true);
    try {
      if (!isHRMPlus()) {
        // 1. Employee: Only call GET /api/dashboard/me
        const myData = await dashboardApi.getMyDashboard();
        setEmployeeDashboard(myData);
      } else if (!isHRPUPlus()) {
        // 2. HR Manager: Summary, Attendance Overview, Departments, Alerts
        const filters = {
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
          department_id: departmentId || undefined,
          employee_type: employeeType || undefined,
        };

        const [sum, depts, att, alertList, myData] = await Promise.all([
          dashboardApi.getSummary(filters).catch(() => null),
          departmentsApi.getDepartments().catch(() => []),
          dashboardApi.getAttendanceOverview(filters).catch(() => null),
          dashboardApi.getAlerts().catch(() => []),
          dashboardApi.getMyDashboard().catch(() => null),
        ]);

        setSummary(sum);
        setDepartments(depts || []);
        setAttendanceOverview(att);
        setAlerts(alertList || []);
        if (myData) setEmployeeDashboard(myData);
      } else {
        // 3. HR Payroll User / Manager / Admin: Full data access
        const filters = {
          period_start: periodStart || undefined,
          period_end: periodEnd || undefined,
          department_id: departmentId || undefined,
          employee_type: employeeType || undefined,
        };

        const [sum, depts, deptSal, trend, att, alertList, myData] = await Promise.all([
          dashboardApi.getSummary(filters).catch(() => null),
          departmentsApi.getDepartments().catch(() => []),
          dashboardApi.getSalaryByDepartment(filters).catch(() => []),
          dashboardApi.getNetSalaryTrend(filters).catch(() => []),
          dashboardApi.getAttendanceOverview(filters).catch(() => null),
          dashboardApi.getAlerts().catch(() => []),
          dashboardApi.getMyDashboard().catch(() => null),
        ]);

        setSummary(sum);
        setDepartments(depts || []);
        setSalaryByDept(deptSal || []);
        setNetTrend(trend || []);
        setAttendanceOverview(att);
        setAlerts(alertList || []);
        if (myData) setEmployeeDashboard(myData);
      }
    } catch (err: any) {
      error(err.message || 'Failed to aggregate dashboard intelligence.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [periodStart, periodEnd, departmentId, employeeType]);

  const userName = user?.name || user?.email?.split('@')[0] || 'Team Member';
  const primaryRole = user?.roles?.[0] || 'Employee';

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-100">


      {loading ? (
        <Spinner label="Aggregating live command center data..." />
      ) : (
        <>
          {/* Render One of the 5 Distinct Role Dashboards */}
          {activeRoleView === 'EMPLOYEE' && (
            <EmployeeDashboardView
              userName={userName}
              primaryRole={primaryRole}
              data={employeeDashboard}
            />
          )}

          {activeRoleView === 'HR_MANAGER' && (
            <HRManagerDashboardView
              userName={userName}
              primaryRole={primaryRole}
              summary={summary}
              attendanceOverview={attendanceOverview}
              departments={departments}
              departmentId={departmentId}
              setDepartmentId={setDepartmentId}
              employeeType={employeeType}
              setEmployeeType={setEmployeeType}
              periodStart={periodStart}
              setPeriodStart={setPeriodStart}
              periodEnd={periodEnd}
              setPeriodEnd={setPeriodEnd}
            />
          )}

          {activeRoleView === 'HR_PAYROLL_USER' && (
            <PayrollUserDashboardView
              userName={userName}
              primaryRole={primaryRole}
              summary={summary}
              salaryByDept={salaryByDept}
            />
          )}

          {activeRoleView === 'HR_PAYROLL_MANAGER' && (
            <PayrollManagerDashboardView
              userName={userName}
              primaryRole={primaryRole}
              summary={summary}
              salaryByDept={salaryByDept}
              netTrend={netTrend}
            />
          )}

          {activeRoleView === 'ADMIN' && (
            <AdminDashboardView
              userName={userName}
              primaryRole={primaryRole}
              departments={departments}
            />
          )}
        </>
      )}

    </div>
  );
};

export default DashboardPage;
