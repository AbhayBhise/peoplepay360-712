import { apiClient, apiRequest } from './client';
import { Attendance } from '../types';

export const attendanceApi = {
  getAttendance: async (filters?: {
    employee_id?: number | string;
    date_from?: string;
    date_to?: string;
    status?: string;
  }): Promise<Attendance[]> => {
    return apiRequest<Attendance[]>(apiClient.get('/api/attendance', { params: filters }));
  },

  checkIn: async (data: { employee_id?: number | string; check_in?: string }): Promise<Attendance> => {
    const payload = {
      employeeId: data.employee_id ? String(data.employee_id) : undefined,
      checkIn: data.check_in || new Date().toISOString(),
    };
    return apiRequest<Attendance>(apiClient.post('/api/attendance/check-in', payload));
  },

  checkOut: async (id: number | string, data: { check_out?: string }): Promise<Attendance> => {
    const payload = {
      checkOut: data.check_out || new Date().toISOString(),
    };
    return apiRequest<Attendance>(apiClient.post(`/api/attendance/${id}/check-out`, payload));
  },

  updateAttendance: async (
    id: number | string,
    data: { check_in?: string; check_out?: string; status?: any; note?: string }
  ): Promise<Attendance> => {
    const payload = {
      checkIn: data.check_in,
      checkOut: data.check_out,
      status: data.status,
    };
    return apiRequest<Attendance>(apiClient.put(`/api/attendance/${id}`, payload));
  },
};
