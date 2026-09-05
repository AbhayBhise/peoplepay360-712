import { apiClient, apiRequest } from './client';
import { Contract } from '../types';
import { MOCK_CONTRACTS, MOCK_EMPLOYEES, MOCK_DEPARTMENTS, MOCK_STRUCTURES } from './mockData';

export const contractsApi = {
  getContracts: async (filters?: { employee_id?: number; status?: string }): Promise<Contract[]> => {
    try {
      return await apiRequest<Contract[]>(apiClient.get('/api/contracts', { params: filters }));
    } catch {
      let result = [...MOCK_CONTRACTS];
      if (filters?.employee_id) {
        result = result.filter((c) => c.employee_id === Number(filters.employee_id));
      }
      if (filters?.status) {
        result = result.filter((c) => c.status === filters.status);
      }
      return result;
    }
  },

  createContract: async (data: {
    employee_id: number | string;
    department_id?: number | string | null;
    position?: string | null;
    wage: number;
    salary_structure_id?: number | string | null;
    start_date: string;
    end_date?: string | null;
    status?: string;
  }): Promise<Contract> => {
    try {
      const payload = {
        employeeId: String(data.employee_id),
        departmentId: data.department_id ? String(data.department_id) : undefined,
        position: data.position || undefined,
        wage: Number(data.wage),
        salaryStructureId: data.salary_structure_id ? String(data.salary_structure_id) : undefined,
        startDate: data.start_date,
        endDate: data.end_date || null,
        status: (data.status as any) || 'draft',
      };
      return await apiRequest<Contract>(apiClient.post('/api/contracts', payload));
    } catch {
      const emp = MOCK_EMPLOYEES.find((e) => String(e.id) === String(data.employee_id));
      const dept = MOCK_DEPARTMENTS.find((d) => String(d.id) === String(data.department_id));
      const struct = MOCK_STRUCTURES.find((s) => String(s.id) === String(data.salary_structure_id));
      const newContract: Contract = {
        id: MOCK_CONTRACTS.length + 101,
        employee_id: Number(data.employee_id) || 1,
        employee_name: emp?.name,
        department_id: Number(data.department_id) || 1,
        department_name: dept?.name,
        position: data.position || 'Staff',
        wage: Number(data.wage),
        salary_structure_id: Number(data.salary_structure_id) || 1,
        salary_structure_name: struct?.name,
        start_date: data.start_date,
        end_date: data.end_date,
        status: (data.status as any) || 'draft',
        is_active_for_today: true,
      };
      MOCK_CONTRACTS.unshift(newContract);
      return newContract;
    }
  },

  updateContract: async (id: number, data: Partial<Contract>): Promise<Contract> => {
    try {
      return await apiRequest<Contract>(apiClient.put(`/api/contracts/${id}`, data));
    } catch {
      const index = MOCK_CONTRACTS.findIndex((c) => c.id === id);
      if (index !== -1) {
        MOCK_CONTRACTS[index] = { ...MOCK_CONTRACTS[index], ...data };
        return MOCK_CONTRACTS[index];
      }
      return { id, ...data } as Contract;
    }
  },

  deleteContract: async (id: number): Promise<{ message?: string }> => {
    try {
      return await apiRequest(apiClient.delete(`/api/contracts/${id}`));
    } catch {
      const index = MOCK_CONTRACTS.findIndex((c) => c.id === id);
      if (index !== -1) {
        MOCK_CONTRACTS.splice(index, 1);
      }
      return { message: 'Contract deleted' };
    }
  },
};
