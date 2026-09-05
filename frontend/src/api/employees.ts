import { apiClient, apiRequest } from './client';
import { Employee, Contract, Attendance, TimeOffRequest, PayslipSummary } from '../types';

export interface EmployeeFilters {
  department_id?: number;
  status?: string;
  search?: string;
}

export const employeesApi = {
  getEmployees: async (filters?: EmployeeFilters): Promise<Employee[]> => {
    return apiRequest<Employee[]>(apiClient.get('/api/employees', { params: filters }));
  },

  getEmployeeById: async (id: number | string): Promise<Employee> => {
    return apiRequest<Employee>(apiClient.get(`/api/employees/${id}`));
  },

  createEmployee: async (data: {
    name: string;
    department_id: number;
    manager_id?: number | null;
    job_position: string;
    status: 'active' | 'inactive';
    working_schedule_id?: number;
  }): Promise<Employee> => {
    return apiRequest<Employee>(apiClient.post('/api/employees', data));
  },

  updateEmployee: async (
    id: number | string,
    data: {
      name?: string;
      department_id?: number;
      manager_id?: number | null;
      job_position?: string;
      status?: 'active' | 'inactive';
      working_schedule_id?: number;
    }
  ): Promise<Employee> => {
    return apiRequest<Employee>(apiClient.put(`/api/employees/${id}`, data));
  },

  deleteEmployee: async (id: number | string): Promise<{ message?: string }> => {
    return apiRequest(apiClient.delete(`/api/employees/${id}`));
  },

  // Smart button backing endpoints:
  getEmployeeContracts: async (id: number | string): Promise<Contract[]> => {
    return apiRequest<Contract[]>(apiClient.get(`/api/employees/${id}/contracts`));
  },

  getEmployeeAttendance: async (id: number | string): Promise<Attendance[]> => {
    return apiRequest<Attendance[]>(apiClient.get(`/api/employees/${id}/attendance`));
  },

  getEmployeeTimeOff: async (id: number | string): Promise<TimeOffRequest[]> => {
    return apiRequest<TimeOffRequest[]>(apiClient.get(`/api/employees/${id}/time-off`));
  },

  getEmployeePayslips: async (id: number | string): Promise<PayslipSummary[]> => {
    return apiRequest<PayslipSummary[]>(apiClient.get(`/api/employees/${id}/payslips`));
  },
};
