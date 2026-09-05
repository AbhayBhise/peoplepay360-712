import { apiClient, apiRequest } from './client';
import { Attendance } from '../types';

export const attendanceApi = {
  getAttendance: async (filters?: {
    employee_id?: number;
    date_from?: string;
    date_to?: string;
    status?: string;
  }): Promise<Attendance[]> => {
    return apiRequest<Attendance[]>(apiClient.get('/api/attendance', { params: filters }));
  },

  checkIn: async (data: { employee_id?: number; check_in?: string }): Promise<Attendance> => {
    return apiRequest<Attendance>(apiClient.post('/api/attendance/check-in', data));
  },

  checkOut: async (id: number, data: { check_out?: string }): Promise<Attendance> => {
    return apiRequest<Attendance>(apiClient.post(`/api/attendance/${id}/check-out`, data));
  },

  updateAttendance: async (
    id: number,
    data: { check_in?: string; check_out?: string; note?: string }
  ): Promise<Attendance> => {
    return apiRequest<Attendance>(apiClient.put(`/api/attendance/${id}`, data));
  },
};
