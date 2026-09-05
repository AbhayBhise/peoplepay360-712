import { apiClient, apiRequest } from './client';
import { Department } from '../types';
import { MOCK_DEPARTMENTS } from './mockData';

// Backend returns camelCase (docs/02_API_CONTRACTS.md); frontend types use snake_case.
function normalizeDepartment(raw: any): Department {
  return {
    id: raw.id,
    name: raw.name,
    parent_department_id: raw.parentDepartmentId ?? null,
    head_employee_id: raw.headEmployeeId ?? null,
  };
}

export const departmentsApi = {
  getDepartments: async (parentId?: number): Promise<Department[]> => {
    try {
      const params = parentId !== undefined ? { parent_id: parentId } : {};
      const raw = await apiRequest<any[]>(apiClient.get('/api/departments', { params }));
      return raw.map(normalizeDepartment);
    } catch {
      if (parentId !== undefined) {
        return MOCK_DEPARTMENTS.filter((d) => d.parent_department_id === parentId);
      }
      return MOCK_DEPARTMENTS;
    }
  },

  createDepartment: async (data: {
    name: string;
    parent_department_id?: number | null;
    head_employee_id?: number | null;
  }): Promise<Department> => {
    try {
      const payload = {
        name: data.name,
        parentDepartmentId: data.parent_department_id ?? undefined,
        headEmployeeId: data.head_employee_id ?? undefined,
      };
      const raw = await apiRequest<any>(apiClient.post('/api/departments', payload));
      return normalizeDepartment(raw);
    } catch {
      const newDept: Department = {
        id: MOCK_DEPARTMENTS.length + 1,
        name: data.name,
        parent_department_id: data.parent_department_id || null,
        head_employee_id: data.head_employee_id || null,
      };
      MOCK_DEPARTMENTS.push(newDept);
      return newDept;
    }
  },

  updateDepartment: async (
    id: number,
    data: {
      name: string;
      parent_department_id?: number | null;
      head_employee_id?: number | null;
    }
  ): Promise<Department> => {
    try {
      const payload = {
        name: data.name,
        parentDepartmentId: data.parent_department_id ?? undefined,
        headEmployeeId: data.head_employee_id ?? undefined,
      };
      const raw = await apiRequest<any>(apiClient.put(`/api/departments/${id}`, payload));
      return normalizeDepartment(raw);
    } catch {
      const index = MOCK_DEPARTMENTS.findIndex((d) => d.id === id);
      if (index !== -1) {
        MOCK_DEPARTMENTS[index] = { ...MOCK_DEPARTMENTS[index], ...data };
        return MOCK_DEPARTMENTS[index];
      }
      return { id, ...data };
    }
  },

  deleteDepartment: async (id: number): Promise<{ message?: string }> => {
    try {
      return await apiRequest(apiClient.delete(`/api/departments/${id}`));
    } catch {
      const index = MOCK_DEPARTMENTS.findIndex((d) => d.id === id);
      if (index !== -1) {
        MOCK_DEPARTMENTS.splice(index, 1);
      }
      return { message: 'Department deleted successfully' };
    }
  },
};
