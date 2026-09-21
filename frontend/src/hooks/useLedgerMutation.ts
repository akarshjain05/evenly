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
      // 1. Trim the infinite cache to 1 page to prevent the 7-second sequential reload nightmare
      queryClient.setQueryData(['group-activity', id], (old: any) => {
        if (!old || !old.pages) return old;
        return {
          ...old,
          pages: [old.pages[0]]
        };
      });
      
      // 2. AWAIT the refetch! This ensures the modal stays in "Saving..." state
      // until the new item is actually retrieved and placed into the activity list.
      await queryClient.invalidateQueries({ queryKey: ['group-activity', id] });

      // 3. Update balances directly from the backend response
      const payload = data?.data || data;
      if (payload && payload.members) {
        queryClient.setQueryData(['group', id], payload);
      }
      
      // 4. Fire the custom onSuccess (which finally closes the modal)
      // Because we waited, the modal closes, the item appears, and balances update at the EXACT same millisecond!
      if (onSuccess) onSuccess(data, variables, context);
    },


    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    }
  });
}
