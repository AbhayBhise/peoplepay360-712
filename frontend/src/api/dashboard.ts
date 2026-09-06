import { apiClient, apiRequest } from './client';
import {
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
  EmployeeDashboard,
} from '../types';

export interface DashboardFilters {
  period_start?: string;
  period_end?: string;
  department_id?: string | number;
  employee_type?: string;
}

function mapSummary(raw: any): DashboardSummary {
  if (!raw) {
    return {
      total_net_paid: 0,
      payslips_generated: 0,
      average_salary: 0,
      approved_time_off_count: 0,
      attendance_health_pct: 100,
    };
  }
  return {
    total_net_paid: raw.totalNetPaid !== undefined ? Number(raw.totalNetPaid) : 0,
    payslips_generated: raw.payslipsGenerated !== undefined ? Number(raw.payslipsGenerated) : 0,
    average_salary: raw.averageSalary !== undefined ? Number(raw.averageSalary) : 0,
    approved_time_off_count: raw.approvedTimeOff !== undefined ? Number(raw.approvedTimeOff) : 0,
    attendance_health_pct: raw.attendanceHealthPct !== undefined ? Number(raw.attendanceHealthPct) : 100,
  };
}

function mapSalaryByDepartment(raw: any[]): SalaryByDepartment[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((d) => ({
    department_id: d.departmentId,
    department_name: d.departmentName,
    headcount: d.headcount ?? 0,
    total_salary: d.totalSalary !== undefined ? Number(d.totalSalary) : 0,
  }));
}

function mapNetSalaryTrend(raw: any[]): NetSalaryTrend[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((t) => ({ month: t.month, net_total: t.netTotal !== undefined ? Number(t.netTotal) : 0 }));
}

function mapAttendanceOverview(raw: any): AttendanceOverview {
  if (!raw) {
    return {
      present: 0,
      late: 0,
      absent: 0,
      overtime: 0,
      missing_checkouts: 0,
      manual_edits: 0,
      coverage_pct: 100,
    };
  }
  return {
    present: raw.present ?? 0,
    late: raw.late ?? 0,
    absent: raw.absent ?? 0,
    overtime: raw.overtime ?? 0,
    missing_checkouts: raw.missingCheckouts ?? 0,
    manual_edits: raw.manualEdits ?? 0,
    coverage_pct: raw.coveragePct !== undefined ? Number(raw.coveragePct) : 100,
  };
}

export const dashboardApi = {
  getMyDashboard: async (): Promise<EmployeeDashboard> => {
    const raw = await apiRequest<any>(apiClient.get('/api/dashboard/me'));
    // Backend returns the exact EmployeeDashboard shape after envelope unwrap:
    // { attendanceThisMonth: { present, late, missingCheckouts, totalDays },
    //   leaveBalances: [{ typeName, allocated, taken, remaining }],
    //   recentTimeOffRequests: [{ typeName, dateFrom, dateTo, duration, status }],
    //   recentPayslips: [{ id, net, status }] }
    if (!raw) {
      return {
        attendanceThisMonth: { present: 0, late: 0, missingCheckouts: 0, totalDays: 0 },
        leaveBalances: [],
        recentTimeOffRequests: [],
        recentPayslips: [],
      };
    }
    return raw as EmployeeDashboard;
  },

  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    const raw = await apiRequest<any>(apiClient.get('/api/dashboard/summary', { params: filters }));
    return mapSummary(raw);
  },

  getSalaryByDepartment: async (filters?: DashboardFilters): Promise<SalaryByDepartment[]> => {
    const raw = await apiRequest<any[]>(
      apiClient.get('/api/dashboard/salary-by-department', { params: filters })
    );
    return mapSalaryByDepartment(raw);
  },

  getNetSalaryTrend: async (filters?: DashboardFilters): Promise<NetSalaryTrend[]> => {
    const raw = await apiRequest<any[]>(
      apiClient.get('/api/dashboard/net-salary-trend', { params: filters })
    );
    return mapNetSalaryTrend(raw);
  },

  getAttendanceOverview: async (filters?: DashboardFilters): Promise<AttendanceOverview> => {
    const raw = await apiRequest<any>(
      apiClient.get('/api/dashboard/attendance-overview', { params: filters })
    );
    return mapAttendanceOverview(raw);
  },

  getAlerts: async (): Promise<string[]> => {
    return apiRequest<string[]>(apiClient.get('/api/dashboard/alerts'));
  },
};
