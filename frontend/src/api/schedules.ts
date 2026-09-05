import { apiClient, apiRequest } from './client';
import { WorkingSchedule } from '../types';

export const schedulesApi = {
  getSchedules: async (): Promise<WorkingSchedule[]> => {
    return apiRequest<WorkingSchedule[]>(apiClient.get('/api/working-schedules'));
  },

  getScheduleById: async (id: number): Promise<WorkingSchedule> => {
    return apiRequest<WorkingSchedule>(apiClient.get(`/api/working-schedules/${id}`));
  },

  createSchedule: async (data: {
    name: string;
    type: string;
    lines: Array<{ day: string; start_time: string; end_time: string; break: number }>;
  }): Promise<WorkingSchedule> => {
    return apiRequest<WorkingSchedule>(apiClient.post('/api/working-schedules', data));
  },

  updateSchedule: async (
    id: number,
    data: {
      name: string;
      type: string;
      lines: Array<{ day: string; start_time: string; end_time: string; break: number }>;
    }
  ): Promise<WorkingSchedule> => {
    return apiRequest<WorkingSchedule>(apiClient.put(`/api/working-schedules/${id}`, data));
  },
};
