import { apiClient, apiRequest } from './client';
import { TimeOffType, TimeOffAllocation, TimeOffRequest } from '../types';

// Map between backend camelCase and frontend snake_case
function normalizeType(raw: any): TimeOffType {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    name: raw.name,
    unit: raw.unit || 'days',
    requires_allocation: raw.requiresAllocation ?? raw.requires_allocation ?? true,
    requiresAllocation: raw.requiresAllocation ?? raw.requires_allocation ?? true,
    payroll_integration: raw.payrollIntegration ?? raw.payroll_integration ?? true,
    payrollIntegration: raw.payrollIntegration ?? raw.payroll_integration ?? true,
  } as any;
}

function normalizeAllocation(raw: any): TimeOffAllocation {
  if (!raw) return raw;
  const employeeId = raw.employeeId ?? raw.employee_id ?? '';
  const typeId = raw.typeId ?? raw.type_id ?? '';
  const allocated = Number(raw.allocated ?? 0);
  const taken = Number(raw.taken ?? 0);
  const remaining = raw.remaining !== undefined ? Number(raw.remaining) : allocated - taken;

  return {
    id: String(raw.id),
    employee_id: String(employeeId),
    employeeId: String(employeeId),
    employee_name: raw.employee?.name ?? raw.employee_name ?? raw.employeeName,
    employeeName: raw.employee?.name ?? raw.employee_name ?? raw.employeeName,
    type_id: String(typeId),
    typeId: String(typeId),
    type_name: raw.type?.name ?? raw.type_name ?? raw.typeName,
    typeName: raw.type?.name ?? raw.type_name ?? raw.typeName,
    allocated,
    taken,
    remaining,
    valid_from: raw.validFrom ? String(raw.validFrom).slice(0, 10) : (raw.valid_from || ''),
    validFrom: raw.validFrom ? String(raw.validFrom).slice(0, 10) : (raw.valid_from || ''),
    valid_to: raw.validTo ? String(raw.validTo).slice(0, 10) : (raw.valid_to || ''),
    validTo: raw.validTo ? String(raw.validTo).slice(0, 10) : (raw.valid_to || ''),
    status: raw.status,
  } as any;
}

function normalizeRequest(raw: any): TimeOffRequest {
  if (!raw) return raw;
  const employeeId = raw.employeeId ?? raw.employee_id ?? '';
  const typeId = raw.typeId ?? raw.type_id ?? '';

  return {
    id: String(raw.id),
    employee_id: String(employeeId),
    employeeId: String(employeeId),
    employee_name: raw.employee?.name ?? raw.employee_name ?? raw.employeeName,
    employeeName: raw.employee?.name ?? raw.employee_name ?? raw.employeeName,
    type_id: String(typeId),
    typeId: String(typeId),
    type_name: raw.type?.name ?? raw.type_name ?? raw.typeName,
    typeName: raw.type?.name ?? raw.type_name ?? raw.typeName,
    date_from: raw.dateFrom ? String(raw.dateFrom).slice(0, 10) : (raw.date_from || ''),
    dateFrom: raw.dateFrom ? String(raw.dateFrom).slice(0, 10) : (raw.date_from || ''),
    date_to: raw.dateTo ? String(raw.dateTo).slice(0, 10) : (raw.date_to || ''),
    dateTo: raw.dateTo ? String(raw.dateTo).slice(0, 10) : (raw.date_to || ''),
    duration: Number(raw.duration ?? 0),
    status: raw.status,
    reason: raw.reason,
  } as any;
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
      requiresAllocation: data.requires_allocation ?? (data as any).requiresAllocation,
      payrollIntegration: data.payroll_integration ?? (data as any).payrollIntegration,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/time-off/types', payload));
    return normalizeType(raw);
  },

  updateType: async (id: number | string, data: Partial<TimeOffType>): Promise<TimeOffType> => {
    const payload = {
      name: data.name,
      unit: data.unit,
      requiresAllocation: data.requires_allocation ?? (data as any).requiresAllocation,
      payrollIntegration: data.payroll_integration ?? (data as any).payrollIntegration,
    };
    const raw = await apiRequest<any>(apiClient.put(`/api/time-off/types/${id}`, payload));
    return normalizeType(raw);
  },

  getAllocations: async (filters?: {
    employee_id?: number | string;
    employeeId?: number | string;
    type_id?: number | string;
    typeId?: number | string;
    status?: string;
  }): Promise<TimeOffAllocation[]> => {
    const params: any = {};
    const empId = filters?.employee_id ?? filters?.employeeId;
    if (empId) params.employee_id = String(empId);
    const typeId = filters?.type_id ?? filters?.typeId;
    if (typeId) params.type_id = String(typeId);
    if (filters?.status) params.status = filters.status;
    const raw = await apiRequest<any[]>(apiClient.get('/api/time-off/allocations', { params }));
    return Array.isArray(raw) ? raw.map(normalizeAllocation) : [];
  },

  createAllocation: async (data: {
    employee_id?: number | string;
    employeeId?: number | string;
    type_id?: number | string;
    typeId?: number | string;
    allocated: number;
    valid_from?: string;
    validFrom?: string;
    valid_to?: string;
    validTo?: string;
  }): Promise<TimeOffAllocation> => {
    const payload = {
      employeeId: String(data.employeeId ?? data.employee_id),
      typeId: String(data.typeId ?? data.type_id),
      allocated: Number(data.allocated),
      validFrom: data.validFrom ?? data.valid_from,
      validTo: (data.validTo ?? data.valid_to) || null,
    };
    const raw = await apiRequest<any>(apiClient.post('/api/time-off/allocations', payload));
    return normalizeAllocation(raw);
  },

  approveAllocation: async (id: number | string): Promise<TimeOffAllocation> => {
    const raw = await apiRequest<any>(apiClient.post(`/api/time-off/allocations/${id}/approve`));
    return normalizeAllocation(raw);
  },

  getRequests: async (filters?: {
    employee_id?: number | string;
    employeeId?: number | string;
    status?: string;
  }): Promise<TimeOffRequest[]> => {
    const params: any = {};
    const empId = filters?.employee_id ?? filters?.employeeId;
    if (empId) params.employee_id = String(empId);
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
    employee_id?: number | string;
    employeeId?: number | string;
    type_id?: number | string;
    typeId?: number | string;
    date_from?: string;
    dateFrom?: string;
    date_to?: string;
    dateTo?: string;
    reason?: string;
  }): Promise<TimeOffRequest> => {
    const payload = {
      employeeId: String(data.employeeId ?? data.employee_id),
      typeId: String(data.typeId ?? data.type_id),
      dateFrom: data.dateFrom ?? data.date_from,
      dateTo: data.dateTo ?? data.date_to,
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
