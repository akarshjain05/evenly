import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';

export interface LedgerMutationOptions<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onError?: (err: AxiosError | Error, variables: TVariables, context: any) => void;
  onSuccess?: (data: any, variables: TVariables, context: any) => void;
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
    onSuccess: async (data: any, variables: TVariables, context: any) => {
      // 1. Update balances instantly from the backend response
      const payload = data?.data || data;
      if (payload && payload.members) {
        queryClient.setQueryData(['group', id], payload);
      }
      
      // 2. Fire the custom onSuccess for pessimistic cache updates (like instantly removing a deleted item)
      if (onSuccess) onSuccess(data, variables, context);

      // 3. Trim the infinite cache to 1 page to prevent the 7-second sequential reload nightmare,
      // without using resetQueries() which causes a jarring skeleton flash.
      queryClient.setQueryData(['group-activity', id], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: [old.pages[0]]
        };
      });
      
      // 4. Silently refetch that single page in the background to ensure absolute consistency
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    }
  });
}
