import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';

export interface LedgerMutationOptions<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
    onError?: (err: AxiosError | Error, variables: TVariables, context: any) => void;
  onMutate?: (variables: TVariables) => Promise<any> | any;
  onSuccess?: (data?: any) => void;
}

export function useLedgerMutation<TVariables, TData>({ 
  mutationFn, 
  onError,
  onSuccess,
  onMutate
}: LedgerMutationOptions<TVariables, TData>) {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  return useMutation({
    onMutate,
    mutationFn,
    
    onError: (err: AxiosError | Error, _variables: TVariables, context: { previousActivity?: unknown; previousGroup?: unknown } | undefined) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(['group-activity', id], context.previousActivity);
      }
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', id], context.previousGroup);
      } else {
        queryClient.invalidateQueries({ queryKey: ['group', id] });
      }
      if (onError) onError(err, _variables, context);
    },
    onSuccess: async (data: any) => {
      // Force the background refetch of the activity list to block the onSuccess callback.
      // This ensures the modal stays in the "Saving..." state until BOTH the balances 
      // (which we inject directly) and the activity list (which we fetch) are fully in sync.
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });

      // If the backend returns the updated group details directly, instantly update the UI cache
      // without waiting for the background invalidation refetch.
      const payload = data?.data || data;
      if (payload && payload.members) {
        queryClient.setQueryData(['group', id], payload);
      }
      if (onSuccess) onSuccess(data);
    },
    onSettled: () => {
      // Background re-verification
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    }
  });
}
