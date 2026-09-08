import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi, DepartmentFilters } from '../api/departments';

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (filters: DepartmentFilters = {}) => [...departmentKeys.lists(), filters] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...departmentKeys.details(), id] as const,
};

export function useDepartments(filters: DepartmentFilters = {}) {
  return useQuery({
    queryKey: departmentKeys.list(filters),
    queryFn: () => departmentsApi.getDepartments(filters),
  });
}

export function useDepartment(id: string | number | undefined) {
  return useQuery({
    queryKey: departmentKeys.detail(id!),
    queryFn: () => departmentsApi.getDepartmentById(id!),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Parameters<typeof departmentsApi.updateDepartment>[1] }) =>
      departmentsApi.updateDepartment(id, data),
    onSuccess: (data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: departmentKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.id) }),
        // Invalidate employee queries since they might display department names
        queryClient.invalidateQueries({ queryKey: ['employees'] })
      ]);
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: departmentsApi.deleteDepartment,
    onSuccess: (data, id) => {
      queryClient.removeQueries({ queryKey: departmentKeys.detail(id) });
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: departmentKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: ['employees'] })
      ]);
    },
  });
}
