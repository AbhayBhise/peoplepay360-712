import { apiClient, apiRequest } from './client';
import { Contract } from '../types';

export const contractsApi = {
  getContracts: async (filters?: { employee_id?: number; status?: string }): Promise<Contract[]> => {
    return apiRequest<Contract[]>(apiClient.get('/api/contracts', { params: filters }));
  },

  createContract: async (data: {
    employee_id: number;
    department_id: number;
    position: string;
    wage: number;
    salary_structure_id: number;
    start_date: string;
    end_date?: string | null;
    status: string;
  }): Promise<Contract> => {
    return apiRequest<Contract>(apiClient.post('/api/contracts', data));
  },

  updateContract: async (id: number, data: Partial<Contract>): Promise<Contract> => {
    return apiRequest<Contract>(apiClient.put(`/api/contracts/${id}`, data));
  },

  deleteContract: async (id: number): Promise<{ message?: string }> => {
    return apiRequest(apiClient.delete(`/api/contracts/${id}`));
  },
};
