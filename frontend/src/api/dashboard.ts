import { apiClient, apiRequest } from './client';
import {
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
} from '../types';
import { MOCK_EMPLOYEES, MOCK_CONTRACTS, MOCK_REQUESTS, MOCK_ATTENDANCE } from './mockData';

export interface DashboardFilters {
  period_start?: string;
  period_end?: string;
  department_id?: number;
  employee_type?: string;
}

// Backend returns camelCase (docs/02_API_CONTRACTS.md); frontend types use snake_case
// matching the mock data shape. Map once here rather than touching every consumer.
function mapSummary(raw: any): DashboardSummary {
  return {
    total_net_paid: raw.totalNetPaid,
    payslips_generated: raw.payslipsGenerated,
    average_salary: raw.averageSalary,
    approved_time_off_count: raw.approvedTimeOff,
    attendance_health_pct: raw.attendanceHealthPct,
  };
}
function mapSalaryByDepartment(raw: any[]): SalaryByDepartment[] {
  return raw.map((d) => ({
    department_id: d.departmentId,
    department_name: d.departmentName,
    headcount: d.headcount,
    total_salary: d.totalSalary,
  }));
}
function mapNetSalaryTrend(raw: any[]): NetSalaryTrend[] {
  return raw.map((t) => ({ month: t.month, net_total: t.netTotal }));
}
function mapAttendanceOverview(raw: any): AttendanceOverview {
  return {
    present: raw.present,
    late: raw.late,
    absent: raw.absent,
    overtime: raw.overtime ?? 0, // not yet tracked by the backend's Attendance status enum
    missing_checkouts: raw.missingCheckouts,
    manual_edits: raw.manualEdits,
    coverage_pct: raw.coveragePct,
  };
}

export const dashboardApi = {
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
        { department_id: 3, department_name: 'Engineering & Product', headcount: 2, total_salary: 11800 },
        { department_id: 2, department_name: 'Human Resources', headcount: 1, total_salary: 8500 },
        { department_id: 4, department_name: 'Finance & Payroll', headcount: 2, total_salary: 12600 },
        { department_id: 5, department_name: 'Sales & Customer Success', headcount: 1, total_salary: 6000 },
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
