import { apiClient, apiRequest } from './client';
import { Employee, Contract, Attendance, TimeOffRequest, PayslipSummary } from '../types';

export interface EmployeeFilters {
  department_id?: string | number;
  status?: string;
  search?: string;
}

// Backend returns camelCase fields and nested relations (department: {id, name}), not the
// flat snake_case shape the frontend types/components expect. Map once here.
function normalizeEmployee(raw: any): Employee {
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    department_id: raw.departmentId ? String(raw.departmentId) : (raw.department?.id ? String(raw.department.id) : undefined),
    department_name: raw.department?.name,
    manager_id: raw.managerId ? String(raw.managerId) : (raw.manager?.id ? String(raw.manager.id) : null),
    manager_name: raw.manager?.name,
    job_position: raw.jobPosition ?? raw.job_position ?? 'Staff',
    status: raw.status || 'active',
    working_schedule_id: raw.workingScheduleId ? String(raw.workingScheduleId) : (raw.workingSchedule?.id ? String(raw.workingSchedule.id) : undefined),
    working_schedule_name: raw.workingSchedule?.name,
    contracts_count: raw.contractsCount ?? 0,
    contractsCount: raw.contractsCount ?? 0,
    attendance_count: raw.attendanceCount ?? 0,
    attendanceCount: raw.attendanceCount ?? 0,
    time_off_count: raw.timeOffCount ?? 0,
    timeOffCount: raw.timeOffCount ?? 0,
    payslips_count: raw.payslipsCount ?? 0,
    payslipsCount: raw.payslipsCount ?? 0,
  };
}

export const employeesApi = {
  getEmployees: async (filters?: EmployeeFilters): Promise<Employee[]> => {
    const raw = await apiRequest<any[]>(apiClient.get('/api/employees', { params: filters }));
    return Array.isArray(raw) ? raw.map(normalizeEmployee) : [];
  },

  getEmployeeById: async (id: number | string): Promise<Employee> => {
    const raw = await apiRequest<any>(apiClient.get(`/api/employees/${id}`));
    return normalizeEmployee(raw);
  },

  createEmployee: async (data: {
    name: string;
    department_id?: number | string | null;
    manager_id?: number | string | null;
    job_position?: string | null;
    status: 'active' | 'inactive';
    working_schedule_id?: number | string | null;
  }): Promise<Employee> => {
    const payload = {
      name: data.name,
      departmentId: data.department_id ? String(data.department_id) : undefined,
      managerId: data.manager_id ? String(data.manager_id) : undefined,
      jobPosition: data.job_position || undefined,
      status: data.status,
      workingScheduleId: data.working_schedule_id ? String(data.working_schedule_id) : undefined,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/employees', payload));
    return normalizeEmployee(raw);
  },

  updateEmployee: async (
    id: number | string,
    data: {
      name?: string;
      department_id?: number | string | null;
      manager_id?: number | string | null;
      job_position?: string | null;
      status?: 'active' | 'inactive';
      working_schedule_id?: number | string | null;
    }
  ): Promise<Employee> => {
    const payload = {
      name: data.name,
      departmentId: data.department_id ? String(data.department_id) : undefined,
      managerId: data.manager_id ? String(data.manager_id) : undefined,
      jobPosition: data.job_position || undefined,
      status: data.status,
      workingScheduleId: data.working_schedule_id ? String(data.working_schedule_id) : undefined,
    };
    const raw = await apiRequest<any>(apiClient.put(`/api/employees/${id}`, payload));
    return normalizeEmployee(raw);
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
