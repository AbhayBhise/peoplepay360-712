import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi, EmployeeFilters } from '../api/employees';

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...employeeKeys.details(), id] as const,
  contracts: (id: string | number) => [...employeeKeys.detail(id), 'contracts'] as const,
  attendance: (id: string | number) => [...employeeKeys.detail(id), 'attendance'] as const,
  timeOff: (id: string | number) => [...employeeKeys.detail(id), 'timeOff'] as const,
  payslips: (id: string | number) => [...employeeKeys.detail(id), 'payslips'] as const,
};

export function useEmployees(filters: EmployeeFilters = {}) {
  return useQuery({
    queryKey: employeeKeys.list(filters),
    queryFn: () => employeesApi.getEmployees(filters),
  });
}

export function useEmployee(id: string | number | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id!),
    queryFn: () => employeesApi.getEmployeeById(id!),
    enabled: !!id,
  });
}

export function useEmployeeContracts(id: string | number | undefined) {
  return useQuery({
    queryKey: employeeKeys.contracts(id!),
    queryFn: () => employeesApi.getEmployeeContracts(id!),
    enabled: !!id,
  });
}

export function useEmployeeAttendance(id: string | number | undefined) {
  return useQuery({
    queryKey: employeeKeys.attendance(id!),
    queryFn: () => employeesApi.getEmployeeAttendance(id!),
    enabled: !!id,
  });
}

export function useEmployeeTimeOff(id: string | number | undefined) {
  return useQuery({
    queryKey: employeeKeys.timeOff(id!),
    queryFn: () => employeesApi.getEmployeeTimeOff(id!),
    enabled: !!id,
  });
}

export function useEmployeePayslips(id: string | number | undefined) {
  return useQuery({
    queryKey: employeeKeys.payslips(id!),
    queryFn: () => employeesApi.getEmployeePayslips(id!),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.createEmployee,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Parameters<typeof employeesApi.updateEmployee>[1] }) =>
      employeesApi.updateEmployee(id, data),
    onSuccess: (data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: employeeKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) })
      ]);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.deleteEmployee,
    onSuccess: (data, id) => {
      queryClient.removeQueries({ queryKey: employeeKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}
