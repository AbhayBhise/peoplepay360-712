import { apiClient, apiRequest } from './client';
import { TimeOffType, TimeOffAllocation, TimeOffRequest } from '../types';
import {
  MOCK_TIME_OFF_TYPES,
  MOCK_ALLOCATIONS,
  MOCK_REQUESTS,
  MOCK_EMPLOYEES,
} from './mockData';

export const timeOffApi = {
  getTypes: async (): Promise<TimeOffType[]> => {
    try {
      return await apiRequest<TimeOffType[]>(apiClient.get('/api/time-off/types'));
    } catch {
      return MOCK_TIME_OFF_TYPES;
    }
  },

  createType: async (data: Partial<TimeOffType>): Promise<TimeOffType> => {
    try {
      return await apiRequest<TimeOffType>(apiClient.post('/api/time-off/types', data));
    } catch {
      const newType: TimeOffType = {
        id: MOCK_TIME_OFF_TYPES.length + 1,
        name: data.name || 'Custom Leave',
        unit: data.unit || 'days',
        requires_allocation: data.requires_allocation ?? true,
      };
      MOCK_TIME_OFF_TYPES.push(newType);
      return newType;
    }
  },

  updateType: async (id: number, data: Partial<TimeOffType>): Promise<TimeOffType> => {
    try {
      return await apiRequest<TimeOffType>(apiClient.put(`/api/time-off/types/${id}`, data));
    } catch {
      const index = MOCK_TIME_OFF_TYPES.findIndex((t) => t.id === id);
      if (index !== -1) {
        MOCK_TIME_OFF_TYPES[index] = { ...MOCK_TIME_OFF_TYPES[index], ...data };
        return MOCK_TIME_OFF_TYPES[index];
      }
      return { id, name: 'Leave', unit: 'days', requires_allocation: true, ...data };
    }
  },

  getAllocations: async (filters?: {
    employee_id?: number;
    type_id?: number;
    status?: string;
  }): Promise<TimeOffAllocation[]> => {
    try {
      return await apiRequest<TimeOffAllocation[]>(apiClient.get('/api/time-off/allocations', { params: filters }));
    } catch {
      let result = [...MOCK_ALLOCATIONS];
      if (filters?.employee_id) {
        result = result.filter((a) => a.employee_id === Number(filters.employee_id));
      }
      return result;
    }
  },

  createAllocation: async (data: {
    employee_id: number | string;
    type_id: number | string;
    allocated: number;
    valid_from: string;
    valid_to?: string;
  }): Promise<TimeOffAllocation> => {
    try {
      const payload = {
        employeeId: String(data.employee_id),
        typeId: String(data.type_id),
        allocated: Number(data.allocated),
        validFrom: data.valid_from,
        validTo: data.valid_to || null,
      };
      return await apiRequest<TimeOffAllocation>(apiClient.post('/api/time-off/allocations', payload));
    } catch {
      const emp = MOCK_EMPLOYEES.find((e) => String(e.id) === String(data.employee_id));
      const t = MOCK_TIME_OFF_TYPES.find((item) => String(item.id) === String(data.type_id));
      const newAlloc: TimeOffAllocation = {
        id: MOCK_ALLOCATIONS.length + 1,
        employee_id: Number(data.employee_id) || 1,
        employee_name: emp?.name,
        type_id: Number(data.type_id) || 1,
        type_name: t?.name,
        allocated: data.allocated,
        taken: 0,
        remaining: data.allocated,
        status: 'draft',
        valid_from: data.valid_from,
        valid_to: data.valid_to || '',
      };
      MOCK_ALLOCATIONS.unshift(newAlloc);
      return newAlloc;
    }
  },

  approveAllocation: async (id: number | string): Promise<TimeOffAllocation> => {
    try {
      return await apiRequest<TimeOffAllocation>(apiClient.post(`/api/time-off/allocations/${id}/approve`));
    } catch {
      const index = MOCK_ALLOCATIONS.findIndex((a) => String(a.id) === String(id));
      if (index !== -1) {
        MOCK_ALLOCATIONS[index].status = 'validate';
        return MOCK_ALLOCATIONS[index];
      }
      return { id: Number(id) || 1, employee_id: 1, type_id: 1, allocated: 10, status: 'validate', valid_from: '', valid_to: '' };
    }
  },

  getRequests: async (filters?: { employee_id?: number | string; status?: string }): Promise<TimeOffRequest[]> => {
    try {
      return await apiRequest<TimeOffRequest[]>(apiClient.get('/api/time-off/requests', { params: filters }));
    } catch {
      let result = [...MOCK_REQUESTS];
      if (filters?.employee_id) {
        result = result.filter((r) => String(r.employee_id) === String(filters.employee_id));
      }
      return result;
    }
  },

  getBalance: async (employeeId: number | string, typeId: number | string): Promise<{ requiresAllocation: boolean; remaining: number | null }> => {
    try {
      return await apiRequest<{ requiresAllocation: boolean; remaining: number | null }>(
        apiClient.get('/api/time-off/requests/balance', {
          params: { employee_id: String(employeeId), type_id: String(typeId) },
        })
      );
    } catch {
      const alloc = MOCK_ALLOCATIONS.find(
        (a) => String(a.employee_id) === String(employeeId) && String(a.type_id) === String(typeId) && a.status === 'validate'
      );
      return {
        requiresAllocation: true,
        remaining: alloc?.remaining ?? 10,
      };
    }
  },

  createRequest: async (data: {
    employee_id: number | string;
    type_id: number | string;
    date_from: string;
    date_to: string;
    reason?: string;
  }): Promise<TimeOffRequest> => {
    try {
      const payload = {
        employeeId: String(data.employee_id),
        typeId: String(data.type_id),
        dateFrom: data.date_from,
        dateTo: data.date_to,
      };
      return await apiRequest<TimeOffRequest>(apiClient.post('/api/time-off/requests', payload));
    } catch {
      const emp = MOCK_EMPLOYEES.find((e) => String(e.id) === String(data.employee_id));
      const t = MOCK_TIME_OFF_TYPES.find((item) => String(item.id) === String(data.type_id));
      const d1 = new Date(data.date_from);
      const d2 = new Date(data.date_to);
      const duration = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const newReq: TimeOffRequest = {
        id: MOCK_REQUESTS.length + 1,
        employee_id: Number(data.employee_id) || 1,
        employee_name: emp?.name,
        type_id: Number(data.type_id) || 1,
        type_name: t?.name,
        date_from: data.date_from,
        date_to: data.date_to,
        duration,
        status: 'draft',
        reason: data.reason,
      };
      MOCK_REQUESTS.unshift(newReq);
      return newReq;
    }
  },

  approveRequest: async (id: number): Promise<TimeOffRequest> => {
    try {
      return await apiRequest<TimeOffRequest>(apiClient.post(`/api/time-off/requests/${id}/approve`));
    } catch {
      const index = MOCK_REQUESTS.findIndex((r) => r.id === id);
      if (index !== -1) {
        MOCK_REQUESTS[index].status = 'validate';
        // Deduct from allocation
        const req = MOCK_REQUESTS[index];
        const alloc = MOCK_ALLOCATIONS.find((a) => a.employee_id === req.employee_id && a.type_id === req.type_id);
        if (alloc) {
          alloc.taken = (alloc.taken || 0) + (req.duration || 1);
          alloc.remaining = Math.max(0, alloc.allocated - alloc.taken);
        }
        return MOCK_REQUESTS[index];
      }
      return { id, employee_id: 1, type_id: 1, date_from: '', date_to: '', status: 'validate' };
    }
  },

  refuseRequest: async (id: number): Promise<TimeOffRequest> => {
    try {
      return await apiRequest<TimeOffRequest>(apiClient.post(`/api/time-off/requests/${id}/refuse`));
    } catch {
      const index = MOCK_REQUESTS.findIndex((r) => r.id === id);
      if (index !== -1) {
        MOCK_REQUESTS[index].status = 'refused';
        return MOCK_REQUESTS[index];
      }
      return { id, employee_id: 1, type_id: 1, date_from: '', date_to: '', status: 'refused' };
    }
  },
};
