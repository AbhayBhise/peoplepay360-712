import { apiClient, apiRequest } from './client';
import { Employee, Contract, Attendance, TimeOffRequest, PayslipSummary } from '../types';
import {
  MOCK_EMPLOYEES,
  MOCK_CONTRACTS,
  MOCK_ATTENDANCE,
  MOCK_REQUESTS,
  MOCK_PAYRUNS,
  MOCK_DEPARTMENTS,
} from './mockData';

export interface EmployeeFilters {
  department_id?: number;
  status?: string;
  search?: string;
}

// Backend returns camelCase fields and nested relations (department: {id, name}), not the
// flat snake_case shape the frontend types/components expect. Map once here.
function normalizeEmployee(raw: any): Employee {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    department_id: raw.departmentId ?? raw.department?.id,
    department_name: raw.department?.name,
    manager_id: raw.managerId ?? raw.manager?.id ?? null,
    manager_name: raw.manager?.name,
    job_position: raw.jobPosition ?? raw.job_position,
    status: raw.status,
    working_schedule_id: raw.workingScheduleId ?? raw.workingSchedule?.id,
    working_schedule_name: raw.workingSchedule?.name,
    contracts_count: raw.contractsCount,
    contractsCount: raw.contractsCount,
    attendance_count: raw.attendanceCount,
    attendanceCount: raw.attendanceCount,
    time_off_count: raw.timeOffCount,
    timeOffCount: raw.timeOffCount,
    payslips_count: raw.payslipsCount,
    payslipsCount: raw.payslipsCount,
  };
}

export const employeesApi = {
  getEmployees: async (filters?: EmployeeFilters): Promise<Employee[]> => {
    try {
      const raw = await apiRequest<any[]>(apiClient.get('/api/employees', { params: filters }));
      return raw.map(normalizeEmployee);
    } catch {
      let result = [...MOCK_EMPLOYEES];
      if (filters?.department_id) {
        result = result.filter((e) => e.department_id === Number(filters.department_id));
      }
      if (filters?.status) {
        result = result.filter((e) => e.status === filters.status);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.job_position.toLowerCase().includes(q) ||
            (e.department_name && e.department_name.toLowerCase().includes(q))
        );
      }
      return result;
    }
  },

  getEmployeeById: async (id: number | string): Promise<Employee> => {
    try {
      const raw = await apiRequest<any>(apiClient.get(`/api/employees/${id}`));
      return normalizeEmployee(raw);
    } catch {
      const emp = MOCK_EMPLOYEES.find((e) => e.id === Number(id));
      if (emp) return emp;
      return {
        id: Number(id),
        name: `Employee #${id}`,
        job_position: 'Staff Member',
        status: 'active',
        contracts_count: 1,
        attendance_count: 5,
        time_off_count: 1,
        payslips_count: 1,
      };
    }
  },

  createEmployee: async (data: {
    name: string;
    department_id?: number | string | null;
    manager_id?: number | string | null;
    job_position?: string | null;
    status: 'active' | 'inactive';
    working_schedule_id?: number | string | null;
  }): Promise<Employee> => {
    try {
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
    } catch {
      const dept = MOCK_DEPARTMENTS.find((d) => String(d.id) === String(data.department_id));
      const mgr = MOCK_EMPLOYEES.find((e) => String(e.id) === String(data.manager_id));
      const newEmp: Employee = {
        id: MOCK_EMPLOYEES.length + 1,
        name: data.name,
        department_id: Number(data.department_id) || 1,
        department_name: dept?.name || `Dept #${data.department_id}`,
        manager_id: data.manager_id ? Number(data.manager_id) : null,
        manager_name: mgr?.name,
        job_position: data.job_position || 'Staff',
        status: data.status,
        working_schedule_id: Number(data.working_schedule_id) || 1,
        contracts_count: 0,
        attendance_count: 0,
        time_off_count: 0,
        payslips_count: 0,
      };
      MOCK_EMPLOYEES.unshift(newEmp);
      return newEmp;
    }
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
    try {
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
    } catch {
      const index = MOCK_EMPLOYEES.findIndex((e) => String(e.id) === String(id));
      if (index !== -1) {
        MOCK_EMPLOYEES[index] = { ...MOCK_EMPLOYEES[index], ...data } as any;
        return MOCK_EMPLOYEES[index];
      }
      return { id: Number(id) || 1, name: 'Updated Employee', job_position: 'Staff', status: 'active', ...data } as any;
    }
  },

  deleteEmployee: async (id: number | string): Promise<{ message?: string }> => {
    try {
      return await apiRequest(apiClient.delete(`/api/employees/${id}`));
    } catch {
      const index = MOCK_EMPLOYEES.findIndex((e) => e.id === Number(id));
      if (index !== -1) {
        MOCK_EMPLOYEES[index].status = 'inactive';
      }
      return { message: 'Employee set to inactive' };
    }
  },

  // Smart button backing endpoints:
  getEmployeeContracts: async (id: number | string): Promise<Contract[]> => {
    try {
      return await apiRequest<Contract[]>(apiClient.get(`/api/employees/${id}/contracts`));
    } catch {
      return MOCK_CONTRACTS.filter((c) => c.employee_id === Number(id));
    }
  },

  getEmployeeAttendance: async (id: number | string): Promise<Attendance[]> => {
    try {
      return await apiRequest<Attendance[]>(apiClient.get(`/api/employees/${id}/attendance`));
    } catch {
      return MOCK_ATTENDANCE.filter((a) => a.employee_id === Number(id));
    }
  },

  getEmployeeTimeOff: async (id: number | string): Promise<TimeOffRequest[]> => {
    try {
      return await apiRequest<TimeOffRequest[]>(apiClient.get(`/api/employees/${id}/time-off`));
    } catch {
      return MOCK_REQUESTS.filter((r) => r.employee_id === Number(id));
    }
  },

  getEmployeePayslips: async (id: number | string): Promise<PayslipSummary[]> => {
    try {
      return await apiRequest<PayslipSummary[]>(apiClient.get(`/api/employees/${id}/payslips`));
    } catch {
      const list: PayslipSummary[] = [];
      MOCK_PAYRUNS.forEach((pr) => {
        pr.payslips?.forEach((ps) => {
          if (ps.employee_id === Number(id)) {
            list.push(ps);
          }
        });
      });
      return list;
    }
  },
};
