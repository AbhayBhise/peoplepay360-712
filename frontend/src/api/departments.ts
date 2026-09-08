import { apiClient, apiRequest } from './client';
import { Department, PaginationFilters, PaginatedResult } from '../types';

export type DepartmentFilters = PaginationFilters & { parent_id?: string | number | null };

// Backend returns camelCase (docs/02_API_CONTRACTS.md); frontend types use snake_case.
function normalizeDepartment(raw: any): Department {
  return {
    id: String(raw.id),
    name: raw.name,
    parent_department_id: raw.parentDepartmentId ? String(raw.parentDepartmentId) : (raw.parent_department_id ? String(raw.parent_department_id) : null),
    head_employee_id: raw.headEmployeeId ? String(raw.headEmployeeId) : (raw.head_employee_id ? String(raw.head_employee_id) : null),
    employee_count: raw.employeeCount ?? raw.employee_count ?? 0,
  };
}

export const departmentsApi = {
  getDepartments: async (filters?: DepartmentFilters): Promise<PaginatedResult<Department> | Department[]> => {
    const raw = await apiRequest<any>(apiClient.get('/api/departments', { params: filters }));
    if (raw && !Array.isArray(raw) && Array.isArray(raw.items)) {
      return {
        ...raw,
        items: raw.items.map(normalizeDepartment)
      };
    }
    return Array.isArray(raw) ? raw.map(normalizeDepartment) : [];
  },

  getDepartmentById: async (id: string | number): Promise<Department> => {
    const raw = await apiRequest<any>(apiClient.get(`/api/departments/${id}`));
    return normalizeDepartment(raw);
  },

  createDepartment: async (data: {
    name: string;
    parent_department_id?: string | number | null;
    head_employee_id?: string | number | null;
  }): Promise<Department> => {
    const payload = {
      name: data.name,
      parentDepartmentId: data.parent_department_id ? String(data.parent_department_id) : undefined,
      headEmployeeId: data.head_employee_id ? String(data.head_employee_id) : undefined,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/departments', payload));
    return normalizeDepartment(raw);
  },

  updateDepartment: async (
    id: string | number,
    data: {
      name: string;
      parent_department_id?: string | number | null;
      head_employee_id?: string | number | null;
    }
  ): Promise<Department> => {
    const payload = {
      name: data.name,
      parentDepartmentId: data.parent_department_id ? String(data.parent_department_id) : undefined,
      headEmployeeId: data.head_employee_id ? String(data.head_employee_id) : undefined,
    };
    const raw = await apiRequest<any>(apiClient.put(`/api/departments/${id}`, payload));
    return normalizeDepartment(raw);
  },

  deleteDepartment: async (id: string | number): Promise<{ message?: string }> => {
    return apiRequest(apiClient.delete(`/api/departments/${id}`));
  },
};
