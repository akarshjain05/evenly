import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import type { ActivityResponse } from '../types/api';
import type { AxiosError } from 'axios';

export interface LedgerMutationOptions<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutateActivity?: (oldActivity: ActivityResponse[], variables: TVariables) => ActivityResponse[];
  onError?: (err: AxiosError | Error | any) => void;
  onSuccess?: () => void;
}

export function useLedgerMutation<TVariables, TData>({ 
  mutationFn, 
  onMutateActivity, 
  onError,
  onSuccess
}: LedgerMutationOptions<TVariables, TData>) {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: ['group-activity', id] });
      await queryClient.cancelQueries({ queryKey: ['group', id] });

      const previousActivity = queryClient.getQueryData(['group-activity', id]);
      const previousGroup = queryClient.getQueryData(['group', id]);

      if (onMutateActivity) {
        queryClient.setQueryData(['group-activity', id], (old: any) => {
          if (!old || !old.pages) {
             if (Array.isArray(old)) return onMutateActivity(old, variables);
             return old;
          }
          const newPages = [...old.pages];
          if (newPages.length > 0) {
            newPages[0] = onMutateActivity(newPages[0] || [], variables);
          }
          return { ...old, pages: newPages };
        });
      }

      return { previousActivity, previousGroup };
    },
    onError: (err: AxiosError | Error | any, _variables: TVariables, context: any) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(['group-activity', id], context.previousActivity);
      }
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', id], context.previousGroup);
      } else {
        queryClient.invalidateQueries({ queryKey: ['group', id] });
      }
      if (onError) onError(err);
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    }
  });
}
