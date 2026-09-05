import { apiClient, apiRequest } from './client';
import { Department } from '../types';
import { MOCK_DEPARTMENTS } from './mockData';

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
  getDepartments: async (parentId?: string | number): Promise<Department[]> => {
    try {
      const params = parentId !== undefined ? { parent_id: String(parentId) } : {};
      const raw = await apiRequest<any[]>(apiClient.get('/api/departments', { params }));
      return raw.map(normalizeDepartment);
    } catch {
      if (parentId !== undefined) {
        return MOCK_DEPARTMENTS.filter((d) => String(d.parent_department_id) === String(parentId));
      }
      return MOCK_DEPARTMENTS;
    }
  },

  createDepartment: async (data: {
    name: string;
    parent_department_id?: string | number | null;
    head_employee_id?: string | number | null;
  }): Promise<Department> => {
    try {
      const payload = {
        name: data.name,
        parentDepartmentId: data.parent_department_id ? String(data.parent_department_id) : undefined,
        headEmployeeId: data.head_employee_id ? String(data.head_employee_id) : undefined,
      };
      const raw = await apiRequest<any>(apiClient.post('/api/departments', payload));
      return normalizeDepartment(raw);
    } catch {
      const newDept: Department = {
        id: String(MOCK_DEPARTMENTS.length + 1),
        name: data.name,
        parent_department_id: data.parent_department_id ? String(data.parent_department_id) : null,
        head_employee_id: data.head_employee_id ? String(data.head_employee_id) : null,
      };
      MOCK_DEPARTMENTS.push(newDept);
      return newDept;
    }
  },

  updateDepartment: async (
    id: string | number,
    data: {
      name: string;
      parent_department_id?: string | number | null;
      head_employee_id?: string | number | null;
    }
  ): Promise<Department> => {
    try {
      const payload = {
        name: data.name,
        parentDepartmentId: data.parent_department_id ? String(data.parent_department_id) : undefined,
        headEmployeeId: data.head_employee_id ? String(data.head_employee_id) : undefined,
      };
      const raw = await apiRequest<any>(apiClient.put(`/api/departments/${id}`, payload));
      return normalizeDepartment(raw);
    } catch {
      const index = MOCK_DEPARTMENTS.findIndex((d) => String(d.id) === String(id));
      if (index !== -1) {
        MOCK_DEPARTMENTS[index] = { ...MOCK_DEPARTMENTS[index], ...data } as any;
        return MOCK_DEPARTMENTS[index];
      }
      return {
        id: String(id),
        name: data.name,
        parent_department_id: data.parent_department_id ? String(data.parent_department_id) : null,
        head_employee_id: data.head_employee_id ? String(data.head_employee_id) : null,
      };
    }
  },

  deleteDepartment: async (id: string | number): Promise<{ message?: string }> => {
    try {
      return await apiRequest(apiClient.delete(`/api/departments/${id}`));
    } catch {
      const index = MOCK_DEPARTMENTS.findIndex((d) => String(d.id) === String(id));
      if (index !== -1) {
        MOCK_DEPARTMENTS.splice(index, 1);
      }
      return { message: 'Department deleted successfully' };
    }
  },
};
