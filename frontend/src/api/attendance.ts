import { apiClient, apiRequest } from './client';
import { Attendance, PaginationFilters, PaginatedResult } from '../types';

function normalizeAttendance(raw: any): Attendance {
  if (!raw) return raw;
  const employeeId = raw.employeeId ?? raw.employee_id ?? '';
  return {
    id: String(raw.id),
    employee_id: String(employeeId),
    employeeId: String(employeeId),
    employee_name: raw.employee?.name ?? raw.employee_name ?? raw.employeeName,
    employeeName: raw.employee?.name ?? raw.employee_name ?? raw.employeeName,
    check_in: raw.checkIn ? String(raw.checkIn) : (raw.check_in || ''),
    checkIn: raw.checkIn ? String(raw.checkIn) : (raw.check_in || ''),
    check_out: raw.checkOut ? String(raw.checkOut) : (raw.check_out || null),
    checkOut: raw.checkOut ? String(raw.checkOut) : (raw.check_out || null),
    worked_hours: raw.workedHours !== undefined ? Number(raw.workedHours) : (raw.worked_hours !== undefined ? Number(raw.worked_hours) : undefined),
    workedHours: raw.workedHours !== undefined ? Number(raw.workedHours) : (raw.worked_hours !== undefined ? Number(raw.worked_hours) : undefined),
    status: raw.status,
    exception: raw.exception,
    note: raw.note,
  } as any;
}

export const attendanceApi = {
  getAttendance: async (filters?: {
    employee_id?: number | string;
    employeeId?: number | string;
    date_from?: string;
    dateFrom?: string;
    date_to?: string;
    dateTo?: string;
    status?: string;
  } & PaginationFilters): Promise<PaginatedResult<Attendance> | Attendance[]> => {
    const params: any = {};
    const empId = filters?.employee_id ?? filters?.employeeId;
    if (empId) params.employee_id = String(empId);
    const dFrom = filters?.date_from ?? filters?.dateFrom;
    if (dFrom) params.date_from = dFrom;
    const dTo = filters?.date_to ?? filters?.dateTo;
    if (dTo) params.date_to = dTo;
    if (filters?.status) params.status = filters.status;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;

    const raw = await apiRequest<any>(apiClient.get('/api/attendance', { params }));
    if (raw && !Array.isArray(raw) && Array.isArray(raw.items)) {
      return {
        ...raw,
        items: raw.items.map(normalizeAttendance)
      };
    }
    return Array.isArray(raw) ? raw.map(normalizeAttendance) : [];
  },

  checkIn: async (data: {
    employee_id?: number | string;
    employeeId?: number | string;
    check_in?: string;
    checkIn?: string;
  }): Promise<Attendance> => {
    const payload = {
      employeeId: String(data.employeeId ?? data.employee_id ?? ''),
      checkIn: data.checkIn ?? data.check_in ?? new Date().toISOString(),
    };
    const raw = await apiRequest<any>(apiClient.post('/api/attendance/check-in', payload));
    return normalizeAttendance(raw);
  },

  checkOut: async (
    id: number | string,
    data: { check_out?: string; checkOut?: string }
  ): Promise<Attendance> => {
    const payload = {
      checkOut: data.checkOut ?? data.check_out ?? new Date().toISOString(),
    };
    const raw = await apiRequest<any>(apiClient.post(`/api/attendance/${id}/check-out`, payload));
    return normalizeAttendance(raw);
  },

  updateAttendance: async (
    id: number | string,
    data: {
      check_in?: string;
      checkIn?: string;
      check_out?: string;
      checkOut?: string;
      status?: any;
      note?: string;
    }
  ): Promise<Attendance> => {
    const payload = {
      checkIn: data.checkIn ?? data.check_in,
      checkOut: data.checkOut ?? data.check_out,
      status: data.status,
      note: data.note,
    };
    const raw = await apiRequest<any>(apiClient.put(`/api/attendance/${id}`, payload));
    return normalizeAttendance(raw);
  },
};
