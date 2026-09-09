import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../api/attendance';
import { Attendance, PaginationFilters } from '../types';

export const useAttendanceList = (
  filters?: {
    employee_id?: number | string;
    employeeId?: number | string;
    date_from?: string;
    dateFrom?: string;
    date_to?: string;
    dateTo?: string;
    status?: string;
  } & PaginationFilters,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => attendanceApi.getAttendance(filters),
    enabled: options?.enabled,
  });
};

export const useCheckIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { employee_id?: number | string; employeeId?: number | string; check_in?: string; checkIn?: string }) =>
      attendanceApi.checkIn(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number | string; data: { check_out?: string; checkOut?: string } }) =>
      attendanceApi.checkOut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: { check_in?: string; checkIn?: string; check_out?: string; checkOut?: string; status?: any; note?: string };
    }) => attendanceApi.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};
