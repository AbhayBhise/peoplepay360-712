import { apiClient, apiRequest } from './client';
import {
  DashboardSummary,
  SalaryByDepartment,
  NetSalaryTrend,
  AttendanceOverview,
} from '../types';

export interface DashboardFilters {
  period_start?: string;
  period_end?: string;
  department_id?: number;
  employee_type?: string;
}

export const dashboardApi = {
  getSummary: async (filters?: DashboardFilters): Promise<DashboardSummary> => {
    return apiRequest<DashboardSummary>(apiClient.get('/api/dashboard/summary', { params: filters }));
  },

  getSalaryByDepartment: async (filters?: DashboardFilters): Promise<SalaryByDepartment[]> => {
    return apiRequest<SalaryByDepartment[]>(
      apiClient.get('/api/dashboard/salary-by-department', { params: filters })
    );
  },

  getNetSalaryTrend: async (filters?: DashboardFilters): Promise<NetSalaryTrend[]> => {
    return apiRequest<NetSalaryTrend[]>(
      apiClient.get('/api/dashboard/net-salary-trend', { params: filters })
    );
  },

  getAttendanceOverview: async (filters?: DashboardFilters): Promise<AttendanceOverview> => {
    return apiRequest<AttendanceOverview>(
      apiClient.get('/api/dashboard/attendance-overview', { params: filters })
    );
  },

  getAlerts: async (): Promise<string[]> => {
    return apiRequest<string[]>(apiClient.get('/api/dashboard/alerts'));
  },
};
