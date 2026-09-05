import { apiClient, apiRequest } from './client';
import {
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
  EmployeeDashboard,
} from '../types';
import { MOCK_EMPLOYEES, MOCK_CONTRACTS, MOCK_REQUESTS, MOCK_ATTENDANCE } from './mockData';

export interface DashboardFilters {
  period_start?: string;
  period_end?: string;
  department_id?: string | number;
  employee_type?: string;
}

// Backend returns camelCase (docs/02_API_CONTRACTS.md); frontend types use snake_case
// matching the mock data shape. Safely coerce missing or omitted fields from HR Manager view.
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
    try {
      const raw = await apiRequest<any>(apiClient.get('/api/dashboard/me'));
      return raw;
    } catch {
      return {
        attendanceThisMonth: {
          present: 21,
          late: 1,
          missingCheckouts: 0,
          totalDays: 22,
        },
        leaveBalances: [
          { typeName: 'Paid Time Off', allocated: 20, taken: 4, remaining: 16 },
          { typeName: 'Sick Leave', allocated: 10, taken: 1, remaining: 9 },
          { typeName: 'Casual Leave', allocated: 5, taken: 0, remaining: 5 },
        ],
        recentTimeOffRequests: [
          { typeName: 'Paid Time Off', dateFrom: '2026-08-10', dateTo: '2026-08-14', duration: 4, status: 'validate' },
          { typeName: 'Sick Leave', dateFrom: '2026-07-22', dateTo: '2026-07-22', duration: 1, status: 'validate' },
        ],
        recentPayslips: [
          { id: '501', net: 64800, status: 'paid', createdAt: '2026-08-31' },
          { id: '488', net: 64800, status: 'paid', createdAt: '2026-07-31' },
        ],
      };
    }
  },

  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    try {
      const raw = await apiRequest<any>(apiClient.get('/api/dashboard/summary', { params: filters }));
      return mapSummary(raw);
    } catch {
      const totalWages = MOCK_CONTRACTS.reduce((sum, c) => sum + (c.wage || 0), 0);
      const avgSalary = MOCK_CONTRACTS.length > 0 ? totalWages / MOCK_CONTRACTS.length : 6500;
      const approvedTimeOff = MOCK_REQUESTS.filter((r) => r.status === 'validate').length;

      return {
        total_net_paid: 48900,
        payslips_generated: 12,
        average_salary: avgSalary,
        approved_time_off_count: approvedTimeOff || 4,
        attendance_health_pct: 96,
      };
    }
  },

  getSalaryByDepartment: async (filters?: DashboardFilters): Promise<SalaryByDepartment[]> => {
    try {
      const raw = await apiRequest<any[]>(
        apiClient.get('/api/dashboard/salary-by-department', { params: filters })
      );
      return mapSalaryByDepartment(raw);
    } catch {
      return [
        { department_id: '3', department_name: 'Engineering & Product', headcount: 2, total_salary: 11800 },
        { department_id: '2', department_name: 'Human Resources', headcount: 1, total_salary: 8500 },
        { department_id: '4', department_name: 'Finance & Payroll', headcount: 2, total_salary: 12600 },
        { department_id: '5', department_name: 'Sales & Customer Success', headcount: 1, total_salary: 6000 },
      ];
    }
  },

  getNetSalaryTrend: async (filters?: DashboardFilters): Promise<NetSalaryTrend[]> => {
    try {
      const raw = await apiRequest<any[]>(
        apiClient.get('/api/dashboard/net-salary-trend', { params: filters })
      );
      return mapNetSalaryTrend(raw);
    } catch {
      return [
        { month: 'Jun 2026', net_total: 42000 },
        { month: 'Jul 2026', net_total: 45500 },
        { month: 'Aug 2026', net_total: 48900 },
      ];
    }
  },

  getAttendanceOverview: async (filters?: DashboardFilters): Promise<AttendanceOverview> => {
    try {
      const raw = await apiRequest<any>(
        apiClient.get('/api/dashboard/attendance-overview', { params: filters })
      );
      return mapAttendanceOverview(raw);
    } catch {
      return {
        present: 24,
        late: 2,
        absent: 1,
        overtime: 4,
        missing_checkouts: 1,
        manual_edits: 0,
        coverage_pct: 96,
      };
    }
  },

  getAlerts: async (): Promise<string[]> => {
    try {
      return await apiRequest<string[]>(apiClient.get('/api/dashboard/alerts'));
    } catch {
      return [
        'Payrun Batch #2 requires Payroll Manager validation',
        'Elena Rostova has 1 pending attendance punch without check-out',
        '2 upcoming employee contract renewals in Q4',
      ];
    }
  },
};
