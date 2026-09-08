import { useQuery } from '@tanstack/react-query';
import { payrollApi } from '../api/payroll';

export const useStructures = () => {
  return useQuery({
    queryKey: ['structures'],
    queryFn: async () => {
      const data = await payrollApi.getStructures();
      return data;
    },
  });
};
