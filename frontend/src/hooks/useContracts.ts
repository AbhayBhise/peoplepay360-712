import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts';
import { Contract } from '../types';

export const useContracts = () => {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const data = await contractsApi.getContracts();
      return data;
    },
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof contractsApi.createContract>[0]) => contractsApi.createContract(data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contract> }) =>
      contractsApi.updateContract(id, data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};
