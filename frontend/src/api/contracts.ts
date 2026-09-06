import { apiClient, apiRequest } from './client';
import { Contract, PaginationFilters, PaginatedResult } from '../types';

function normalizeContract(raw: any): Contract {
  return {
    id: String(raw.id),
    employee_id: String(raw.employeeId ?? raw.employee_id),
    employee_name: raw.employee?.name ?? raw.employee_name,
    department_id: raw.departmentId ?? raw.department_id ? String(raw.departmentId ?? raw.department_id) : undefined,
    department_name: raw.department?.name ?? raw.department_name,
    position: raw.position,
    wage: Number(raw.wage ?? 0),
    salary_structure_id: raw.salaryStructureId ?? raw.salary_structure_id ? String(raw.salaryStructureId ?? raw.salary_structure_id) : undefined,
    salary_structure_name: raw.salaryStructure?.name ?? raw.salary_structure_name,
    start_date: raw.startDate ? String(raw.startDate).slice(0, 10) : raw.start_date,
    end_date: raw.endDate ? String(raw.endDate).slice(0, 10) : raw.end_date,
    status: raw.status,
    is_active_for_today: raw.isActiveForToday ?? raw.is_active_for_today ?? (raw.status === 'active'),
  };
}

export const contractsApi = {
  getContracts: async (filters?: { employee_id?: number | string; status?: string } & PaginationFilters): Promise<PaginatedResult<Contract> | Contract[]> => {
    const rawList = await apiRequest<any>(apiClient.get('/api/contracts', { params: filters }));
    if (rawList && !Array.isArray(rawList) && Array.isArray(rawList.items)) {
      return {
        ...rawList,
        items: rawList.items.map(normalizeContract)
      };
    }
    return Array.isArray(rawList) ? rawList.map(normalizeContract) : [];
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
    const raw = await apiRequest<any>(apiClient.post('/api/contracts', payload));
    return normalizeContract(raw);
  },

  updateContract: async (id: number | string, data: Partial<Contract>): Promise<Contract> => {
    const payload: any = {};
    if (data.employee_id) payload.employeeId = String(data.employee_id);
    if (data.department_id !== undefined) payload.departmentId = data.department_id ? String(data.department_id) : null;
    if (data.position !== undefined) payload.position = data.position;
    if (data.wage !== undefined) payload.wage = Number(data.wage);
    if (data.salary_structure_id !== undefined) payload.salaryStructureId = data.salary_structure_id ? String(data.salary_structure_id) : null;
    if (data.start_date !== undefined) payload.startDate = data.start_date;
    if (data.end_date !== undefined) payload.endDate = data.end_date;
    if (data.status !== undefined) payload.status = data.status;

    const raw = await apiRequest<any>(apiClient.put(`/api/contracts/${id}`, payload));
    return normalizeContract(raw);
  },

  deleteContract: async (id: number | string): Promise<{ message?: string }> => {
    return apiRequest(apiClient.delete(`/api/contracts/${id}`));
  },
};
