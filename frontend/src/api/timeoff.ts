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
    employee_id: number;
    type_id: number;
    allocated: number;
    valid_from: string;
    valid_to: string;
  }): Promise<TimeOffAllocation> => {
    try {
      return await apiRequest<TimeOffAllocation>(apiClient.post('/api/time-off/allocations', data));
    } catch {
      const emp = MOCK_EMPLOYEES.find((e) => e.id === data.employee_id);
      const t = MOCK_TIME_OFF_TYPES.find((item) => item.id === data.type_id);
      const newAlloc: TimeOffAllocation = {
        id: MOCK_ALLOCATIONS.length + 1,
        employee_id: data.employee_id,
        employee_name: emp?.name,
        type_id: data.type_id,
        type_name: t?.name,
        allocated: data.allocated,
        taken: 0,
        remaining: data.allocated,
        status: 'draft',
        valid_from: data.valid_from,
        valid_to: data.valid_to,
      };
      MOCK_ALLOCATIONS.unshift(newAlloc);
      return newAlloc;
    }
  },

  approveAllocation: async (id: number): Promise<TimeOffAllocation> => {
    try {
      return await apiRequest<TimeOffAllocation>(apiClient.post(`/api/time-off/allocations/${id}/approve`));
    } catch {
      const index = MOCK_ALLOCATIONS.findIndex((a) => a.id === id);
      if (index !== -1) {
        MOCK_ALLOCATIONS[index].status = 'validate';
        return MOCK_ALLOCATIONS[index];
      }
      return { id, employee_id: 1, type_id: 1, allocated: 10, status: 'validate', valid_from: '', valid_to: '' };
    }
  },

  getRequests: async (filters?: { employee_id?: number; status?: string }): Promise<TimeOffRequest[]> => {
    try {
      return await apiRequest<TimeOffRequest[]>(apiClient.get('/api/time-off/requests', { params: filters }));
    } catch {
      let result = [...MOCK_REQUESTS];
      if (filters?.employee_id) {
        result = result.filter((r) => r.employee_id === Number(filters.employee_id));
      }
      return result;
    }
  },

  createRequest: async (data: {
    employee_id: number;
    type_id: number;
    date_from: string;
    date_to: string;
    reason?: string;
  }): Promise<TimeOffRequest> => {
    try {
      return await apiRequest<TimeOffRequest>(apiClient.post('/api/time-off/requests', data));
    } catch {
      const emp = MOCK_EMPLOYEES.find((e) => e.id === data.employee_id);
      const t = MOCK_TIME_OFF_TYPES.find((item) => item.id === data.type_id);
      const d1 = new Date(data.date_from);
      const d2 = new Date(data.date_to);
      const duration = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      const newReq: TimeOffRequest = {
        id: MOCK_REQUESTS.length + 1,
        employee_id: data.employee_id,
        employee_name: emp?.name,
        type_id: data.type_id,
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
