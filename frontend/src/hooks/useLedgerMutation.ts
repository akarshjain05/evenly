import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';

export interface LedgerMutationOptions<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onError?: (err: AxiosError | Error, variables: TVariables, context: any) => void;
  onSuccess?: (data?: any) => void;
}

export function useLedgerMutation<TVariables, TData>({ 
  mutationFn, 
  onError,
  onSuccess
}: LedgerMutationOptions<TVariables, TData>) {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  return useMutation({
    mutationFn,
    onError: (err: AxiosError | Error, _variables: TVariables, context: any) => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      if (onError) onError(err, _variables, context);
    },
    onSuccess: async (data: any) => {
      // 200ms reset: Wipe infinite query cache and fetch ONLY page 1 to prevent 7-second sequential delays
      await queryClient.resetQueries({ queryKey: ['group-activity', id] });

      const payload = data?.data || data;
      if (payload && payload.members) {
        queryClient.setQueryData(['group', id], payload);
      }
      if (onSuccess) onSuccess(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    }
  });
}
