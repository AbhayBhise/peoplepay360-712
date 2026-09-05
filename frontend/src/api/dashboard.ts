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

export const dashboardApi = {
  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    try {
      return await apiRequest<DashboardSummary>(apiClient.get('/api/dashboard/summary', { params: filters }));
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
      return await apiRequest<SalaryByDepartment[]>(
        apiClient.get('/api/dashboard/salary-by-department', { params: filters })
      );
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
      return await apiRequest<NetSalaryTrend[]>(
        apiClient.get('/api/dashboard/net-salary-trend', { params: filters })
      );
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
      return await apiRequest<AttendanceOverview>(
        apiClient.get('/api/dashboard/attendance-overview', { params: filters })
      );
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
