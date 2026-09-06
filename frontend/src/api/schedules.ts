import { apiClient, apiRequest } from './client';
import { WorkingSchedule, PaginationFilters, PaginatedResult } from '../types';

function normalizeSchedule(raw: any): WorkingSchedule {
  return {
    id: String(raw.id),
    name: raw.name,
    type: raw.type,
    weekly_hours: Number(raw.weeklyHours ?? raw.weekly_hours ?? 0),
    lines: Array.isArray(raw.lines)
      ? raw.lines.map((l: any) => ({
          day: l.day,
          start_time: l.startTime ?? l.start_time,
          end_time: l.endTime ?? l.end_time,
          break: l.breakMins ?? l.break ?? 0,
        }))
      : [],
  };
}

export const schedulesApi = {
  getSchedules: async (filters?: PaginationFilters): Promise<PaginatedResult<WorkingSchedule> | WorkingSchedule[]> => {
    const raw = await apiRequest<any>(apiClient.get('/api/working-schedules', { params: filters }));
    if (raw && !Array.isArray(raw) && Array.isArray(raw.items)) {
      return {
        ...raw,
        items: raw.items.map(normalizeSchedule)
      };
    }
    return Array.isArray(raw) ? raw.map(normalizeSchedule) : [];
  },

  getScheduleById: async (id: number | string): Promise<WorkingSchedule> => {
    const raw = await apiRequest<any>(apiClient.get(`/api/working-schedules/${id}`));
    return normalizeSchedule(raw);
  },

  createSchedule: async (data: {
    name: string;
    type: string;
    lines: Array<{ day: string; start_time: string; end_time: string; break: number }>;
  }): Promise<WorkingSchedule> => {
    const payload = {
      name: data.name,
      type: data.type,
      lines: data.lines.map((l) => ({
        day: l.day,
        startTime: l.start_time,
        endTime: l.end_time,
        breakMins: l.break,
      })),
    };
    const raw = await apiRequest<any>(apiClient.post('/api/working-schedules', payload));
    return normalizeSchedule(raw);
  },

  updateSchedule: async (
    id: number | string,
    data: {
      name: string;
      type: string;
      lines: Array<{ day: string; start_time: string; end_time: string; break: number }>;
    }
  ): Promise<WorkingSchedule> => {
    const payload = {
      name: data.name,
      type: data.type,
      lines: data.lines.map((l) => ({
        day: l.day,
        startTime: l.start_time,
        endTime: l.end_time,
        breakMins: l.break,
      })),
    };
    const raw = await apiRequest<any>(apiClient.put(`/api/working-schedules/${id}`, payload));
    return normalizeSchedule(raw);
  },
};
