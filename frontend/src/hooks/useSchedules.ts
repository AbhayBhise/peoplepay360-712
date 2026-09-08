import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { WorkingSchedule, PaginationFilters, PaginatedResult } from '../types';

export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters?: PaginationFilters) => [...scheduleKeys.lists(), filters] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...scheduleKeys.details(), id] as const,
};

export const useSchedules = (filters?: PaginationFilters) => {
  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: () => schedulesApi.getSchedules(filters),
    placeholderData: (previousData) => previousData, // keep previous data while fetching new
  });
};

export const useSchedule = (id: string | number) => {
  return useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: () => schedulesApi.getScheduleById(id),
    enabled: !!id,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schedulesApi.createSchedule,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => schedulesApi.updateSchedule(id, data),
    onSuccess: (data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: scheduleKeys.detail(variables.id) }),
        queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() })
      ]);
    },
  });
};
