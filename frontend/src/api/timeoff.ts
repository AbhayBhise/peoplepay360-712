import { apiClient, apiRequest } from './client';
import { TimeOffType, TimeOffAllocation, TimeOffRequest } from '../types';

export const timeOffApi = {
  getTypes: async (): Promise<TimeOffType[]> => {
    return apiRequest<TimeOffType[]>(apiClient.get('/api/time-off/types'));
  },

  createType: async (data: Partial<TimeOffType>): Promise<TimeOffType> => {
    return apiRequest<TimeOffType>(apiClient.post('/api/time-off/types', data));
  },

  updateType: async (id: number, data: Partial<TimeOffType>): Promise<TimeOffType> => {
    return apiRequest<TimeOffType>(apiClient.put(`/api/time-off/types/${id}`, data));
  },

  getAllocations: async (filters?: {
    employee_id?: number;
    type_id?: number;
    status?: string;
  }): Promise<TimeOffAllocation[]> => {
    return apiRequest<TimeOffAllocation[]>(apiClient.get('/api/time-off/allocations', { params: filters }));
  },

  createAllocation: async (data: {
    employee_id: number;
    type_id: number;
    allocated: number;
    valid_from: string;
    valid_to: string;
  }): Promise<TimeOffAllocation> => {
    return apiRequest<TimeOffAllocation>(apiClient.post('/api/time-off/allocations', data));
  },

  approveAllocation: async (id: number): Promise<TimeOffAllocation> => {
    return apiRequest<TimeOffAllocation>(apiClient.post(`/api/time-off/allocations/${id}/approve`));
  },

  getRequests: async (filters?: { employee_id?: number; status?: string }): Promise<TimeOffRequest[]> => {
    return apiRequest<TimeOffRequest[]>(apiClient.get('/api/time-off/requests', { params: filters }));
  },

  createRequest: async (data: {
    employee_id: number;
    type_id: number;
    date_from: string;
    date_to: string;
    reason?: string;
  }): Promise<TimeOffRequest> => {
    return apiRequest<TimeOffRequest>(apiClient.post('/api/time-off/requests', data));
  },

  approveRequest: async (id: number): Promise<TimeOffRequest> => {
    return apiRequest<TimeOffRequest>(apiClient.post(`/api/time-off/requests/${id}/approve`));
  },

  refuseRequest: async (id: number): Promise<TimeOffRequest> => {
    return apiRequest<TimeOffRequest>(apiClient.post(`/api/time-off/requests/${id}/refuse`));
  },
};
