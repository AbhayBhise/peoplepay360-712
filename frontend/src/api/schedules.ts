import { apiClient, apiRequest } from './client';
import { WorkingSchedule } from '../types';
import { MOCK_SCHEDULES } from './mockData';

export const schedulesApi = {
  getSchedules: async (): Promise<WorkingSchedule[]> => {
    try {
      return await apiRequest<WorkingSchedule[]>(apiClient.get('/api/working-schedules'));
    } catch {
      return MOCK_SCHEDULES;
    }
  },

  getScheduleById: async (id: number | string): Promise<WorkingSchedule> => {
    try {
      return await apiRequest<WorkingSchedule>(apiClient.get(`/api/working-schedules/${id}`));
    } catch {
      const s = MOCK_SCHEDULES.find((item) => String(item.id) === String(id));
      return s || MOCK_SCHEDULES[0];
    }
  },

  createSchedule: async (data: {
    name: string;
    type: string;
    lines: Array<{ day: string; start_time: string; end_time: string; break: number }>;
  }): Promise<WorkingSchedule> => {
    try {
      return await apiRequest<WorkingSchedule>(apiClient.post('/api/working-schedules', data));
    } catch {
      let totalMins = 0;
      data.lines.forEach((l) => {
        const [sh, sm] = l.start_time.split(':').map(Number);
        const [eh, em] = l.end_time.split(':').map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm) - (l.break || 0);
        if (diff > 0) totalMins += diff;
      });
      const newSched: WorkingSchedule = {
        id: String(MOCK_SCHEDULES.length + 1),
        name: data.name,
        type: data.type,
        weekly_hours: Number((totalMins / 60).toFixed(1)),
        lines: data.lines,
      };
      MOCK_SCHEDULES.push(newSched);
      return newSched;
    }
  },

  updateSchedule: async (
    id: number | string,
    data: {
      name: string;
      type: string;
      lines: Array<{ day: string; start_time: string; end_time: string; break: number }>;
    }
  ): Promise<WorkingSchedule> => {
    try {
      return await apiRequest<WorkingSchedule>(apiClient.put(`/api/working-schedules/${id}`, data));
    } catch {
      const index = MOCK_SCHEDULES.findIndex((s) => String(s.id) === String(id));
      if (index !== -1) {
        MOCK_SCHEDULES[index] = { ...MOCK_SCHEDULES[index], ...data };
        return MOCK_SCHEDULES[index];
      }
      return { id: String(id), ...data, weekly_hours: 40 };
    }
  },
};
