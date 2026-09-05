import { apiClient, apiRequest } from './client';
import { Attendance } from '../types';
import { MOCK_ATTENDANCE, MOCK_EMPLOYEES } from './mockData';

export const attendanceApi = {
  getAttendance: async (filters?: {
    employee_id?: number;
    date_from?: string;
    date_to?: string;
    status?: string;
  }): Promise<Attendance[]> => {
    try {
      return await apiRequest<Attendance[]>(apiClient.get('/api/attendance', { params: filters }));
    } catch {
      let result = [...MOCK_ATTENDANCE];
      if (filters?.employee_id) {
        result = result.filter((a) => a.employee_id === Number(filters.employee_id));
      }
      return result;
    }
  },

  checkIn: async (data: { employee_id?: number | string; check_in?: string }): Promise<Attendance> => {
    try {
      const payload = {
        employeeId: String(data.employee_id || 1),
        checkIn: data.check_in || new Date().toISOString(),
      };
      return await apiRequest<Attendance>(apiClient.post('/api/attendance/check-in', payload));
    } catch {
      const emp = MOCK_EMPLOYEES.find((e) => String(e.id) === String(data.employee_id));
      const newAtt: Attendance = {
        id: MOCK_ATTENDANCE.length + 201,
        employee_id: Number(data.employee_id || 1),
        employee_name: emp?.name || 'Current User',
        check_in: data.check_in || new Date().toISOString().replace('T', ' ').slice(0, 16),
        check_out: null,
        worked_hours: 0,
        status: 'checked_in',
        exception: 'none',
      };
      MOCK_ATTENDANCE.unshift(newAtt);
      return newAtt;
    }
  },

  checkOut: async (id: number | string, data: { check_out?: string }): Promise<Attendance> => {
    try {
      const payload = {
        checkOut: data.check_out || new Date().toISOString(),
      };
      return await apiRequest<Attendance>(apiClient.post(`/api/attendance/${id}/check-out`, payload));
    } catch {
      const index = MOCK_ATTENDANCE.findIndex((a) => String(a.id) === String(id));
      const checkOutTime = data.check_out || new Date().toISOString().replace('T', ' ').slice(0, 16);
      if (index !== -1) {
        MOCK_ATTENDANCE[index].check_out = checkOutTime;
        MOCK_ATTENDANCE[index].status = 'checked_out';
        MOCK_ATTENDANCE[index].worked_hours = 8.0;
        MOCK_ATTENDANCE[index].exception = 'none';
        return MOCK_ATTENDANCE[index];
      }
      return {
        id: Number(id) || 1,
        employee_id: 1,
        check_in: '09:00',
        check_out: checkOutTime,
        worked_hours: 8.0,
        status: 'checked_out',
        exception: 'none',
      };
    }
  },

  updateAttendance: async (
    id: number | string,
    data: { check_in?: string; check_out?: string; status?: any; note?: string }
  ): Promise<Attendance> => {
    try {
      const payload = {
        checkIn: data.check_in,
        checkOut: data.check_out,
        status: data.status,
      };
      return await apiRequest<Attendance>(apiClient.put(`/api/attendance/${id}`, payload));
    } catch {
      const index = MOCK_ATTENDANCE.findIndex((a) => String(a.id) === String(id));
      if (index !== -1) {
        MOCK_ATTENDANCE[index] = { ...MOCK_ATTENDANCE[index], ...data };
        return MOCK_ATTENDANCE[index];
      }
      return { id: Number(id) || 1, employee_id: 1, check_in: data.check_in || '', check_out: data.check_out, worked_hours: 8 };
    }
  },
};

