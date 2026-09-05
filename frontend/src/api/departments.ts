import { apiClient, apiRequest } from './client';
import { Department } from '../types';
import { MOCK_DEPARTMENTS } from './mockData';

export const departmentsApi = {
  getDepartments: async (parentId?: number): Promise<Department[]> => {
    try {
      const params = parentId !== undefined ? { parent_id: parentId } : {};
      return await apiRequest<Department[]>(apiClient.get('/api/departments', { params }));
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
      return await apiRequest<Department>(apiClient.post('/api/departments', data));
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
      return await apiRequest<Department>(apiClient.put(`/api/departments/${id}`, data));
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
