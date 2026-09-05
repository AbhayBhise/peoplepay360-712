import { apiClient, apiRequest } from './client';
import { Department } from '../types';

export const departmentsApi = {
  getDepartments: async (parentId?: number): Promise<Department[]> => {
    const params = parentId !== undefined ? { parent_id: parentId } : {};
    return apiRequest<Department[]>(apiClient.get('/api/departments', { params }));
  },

  createDepartment: async (data: {
    name: string;
    parent_department_id?: number | null;
    head_employee_id?: number | null;
  }): Promise<Department> => {
    return apiRequest<Department>(apiClient.post('/api/departments', data));
  },

  updateDepartment: async (
    id: number,
    data: {
      name: string;
      parent_department_id?: number | null;
      head_employee_id?: number | null;
    }
  ): Promise<Department> => {
    return apiRequest<Department>(apiClient.put(`/api/departments/${id}`, data));
  },

  deleteDepartment: async (id: number): Promise<{ message?: string }> => {
    return apiRequest(apiClient.delete(`/api/departments/${id}`));
  },
};
