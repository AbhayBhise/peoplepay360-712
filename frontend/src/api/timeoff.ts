import { apiClient, apiRequest } from './client';
import { TimeOffType, TimeOffAllocation, TimeOffRequest } from '../types';

function normalizeType(raw: any): TimeOffType {
  return {
    id: String(raw.id),
    name: raw.name,
    unit: raw.unit || 'days',
    requires_allocation: raw.requiresAllocation ?? raw.requires_allocation ?? true,
    payroll_integration: raw.payrollIntegration ?? raw.payroll_integration ?? true,
  };
}

function normalizeAllocation(raw: any): TimeOffAllocation {
  return {
    id: String(raw.id),
    employee_id: String(raw.employeeId ?? raw.employee_id),
    employee_name: raw.employee?.name ?? raw.employee_name,
    type_id: String(raw.typeId ?? raw.type_id),
    type_name: raw.type?.name ?? raw.type_name,
    allocated: Number(raw.allocated ?? 0),
    taken: Number(raw.taken ?? 0),
    remaining: Number(raw.remaining ?? (Number(raw.allocated ?? 0) - Number(raw.taken ?? 0))),
    valid_from: raw.validFrom ? String(raw.validFrom).slice(0, 10) : (raw.valid_from || ''),
    valid_to: raw.validTo ? String(raw.validTo).slice(0, 10) : (raw.valid_to || ''),
    status: raw.status,
  };
}

function normalizeRequest(raw: any): TimeOffRequest {
  return {
    id: String(raw.id),
    employee_id: String(raw.employeeId ?? raw.employee_id),
    employee_name: raw.employee?.name ?? raw.employee_name,
    type_id: String(raw.typeId ?? raw.type_id),
    type_name: raw.type?.name ?? raw.type_name,
    date_from: raw.dateFrom ? String(raw.dateFrom).slice(0, 10) : (raw.date_from || ''),
    date_to: raw.dateTo ? String(raw.dateTo).slice(0, 10) : (raw.date_to || ''),
    duration: Number(raw.duration ?? 0),
    status: raw.status,
    reason: raw.reason,
  };
}

export const timeOffApi = {
  getTypes: async (): Promise<TimeOffType[]> => {
    const raw = await apiRequest<any[]>(apiClient.get('/api/time-off/types'));
    return Array.isArray(raw) ? raw.map(normalizeType) : [];
  },

  createType: async (data: Partial<TimeOffType>): Promise<TimeOffType> => {
    const payload = {
      name: data.name,
      unit: data.unit,
      requiresAllocation: data.requires_allocation,
      payrollIntegration: data.payroll_integration,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/time-off/types', payload));
    return normalizeType(raw);
  },

  updateType: async (id: number | string, data: Partial<TimeOffType>): Promise<TimeOffType> => {
    const payload = {
      name: data.name,
      unit: data.unit,
      requiresAllocation: data.requires_allocation,
      payrollIntegration: data.payroll_integration,
    };
    const raw = await apiRequest<any>(apiClient.put(`/api/time-off/types/${id}`, payload));
    return normalizeType(raw);
  },

  getAllocations: async (filters?: {
    employee_id?: number | string;
    type_id?: number | string;
    status?: string;
  }): Promise<TimeOffAllocation[]> => {
    const params: any = {};
    if (filters?.employee_id) params.employee_id = String(filters.employee_id);
    if (filters?.type_id) params.type_id = String(filters.type_id);
    if (filters?.status) params.status = filters.status;
    const raw = await apiRequest<any[]>(apiClient.get('/api/time-off/allocations', { params }));
    return Array.isArray(raw) ? raw.map(normalizeAllocation) : [];
  },

  createAllocation: async (data: {
    employee_id: number | string;
    type_id: number | string;
    allocated: number;
    valid_from: string;
    valid_to?: string;
  }): Promise<TimeOffAllocation> => {
    const payload = {
      employeeId: String(data.employee_id),
      typeId: String(data.type_id),
      allocated: Number(data.allocated),
      validFrom: data.valid_from,
      validTo: data.valid_to || null,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/time-off/allocations', payload));
    return normalizeAllocation(raw);
  },

  approveAllocation: async (id: number | string): Promise<TimeOffAllocation> => {
    const raw = await apiRequest<any>(apiClient.post(`/api/time-off/allocations/${id}/approve`));
    return normalizeAllocation(raw);
  },

  getRequests: async (filters?: { employee_id?: number | string; status?: string }): Promise<TimeOffRequest[]> => {
    const params: any = {};
    if (filters?.employee_id) params.employee_id = String(filters.employee_id);
    if (filters?.status) params.status = filters.status;
    const raw = await apiRequest<any[]>(apiClient.get('/api/time-off/requests', { params }));
    return Array.isArray(raw) ? raw.map(normalizeRequest) : [];
  },

  getBalance: async (employeeId: number | string, typeId: number | string): Promise<{ requiresAllocation: boolean; remaining: number | null }> => {
    return apiRequest<{ requiresAllocation: boolean; remaining: number | null }>(
      apiClient.get('/api/time-off/requests/balance', {
        params: { employee_id: String(employeeId), type_id: String(typeId) },
      })
    );
  },

  createRequest: async (data: {
    employee_id: number | string;
    type_id: number | string;
    date_from: string;
    date_to: string;
    reason?: string;
  }): Promise<TimeOffRequest> => {
    const payload = {
      employeeId: String(data.employee_id),
      typeId: String(data.type_id),
      dateFrom: data.date_from,
      dateTo: data.date_to,
      reason: data.reason,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/time-off/requests', payload));
    return normalizeRequest(raw);
  },

  approveRequest: async (id: number | string): Promise<TimeOffRequest> => {
    const raw = await apiRequest<any>(apiClient.post(`/api/time-off/requests/${id}/approve`));
    return normalizeRequest(raw);
  },

  refuseRequest: async (id: number | string): Promise<TimeOffRequest> => {
    const raw = await apiRequest<any>(apiClient.post(`/api/time-off/requests/${id}/refuse`));
    return normalizeRequest(raw);
  },
};
