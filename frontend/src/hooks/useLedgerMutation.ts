import { useMutation, useQueryClient } from '@tanstack/react-query';
import { simplifyDebts } from '../utils/balances';
import { useParams } from 'react-router-dom';
import type { ActivityResponse, GroupDetailResponse } from '../types/api';
import type { AxiosError } from 'axios';

export interface LedgerMutationOptions<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutateActivity?: (oldActivity: ActivityResponse[], variables: TVariables) => ActivityResponse[];
  onMutateBalances?: (variables: TVariables, members: GroupDetailResponse['members']) => Array<{ member_id: string, net_change: number }>;
  onError?: (err: AxiosError | Error | any) => void;
  onSuccess?: () => void;
}

export function useLedgerMutation<TVariables, TData>({ 
  mutationFn, 
  onMutateActivity, 
  onMutateBalances, 
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
        queryClient.setQueryData(['group-activity', id], (old: ActivityResponse[] | undefined) => {
           return onMutateActivity(old || [], variables);
        });
      }

      if (onMutateBalances) {
        queryClient.setQueryData(['group', id], (old: GroupDetailResponse | undefined) => {
          if (!old) return old;
          const newGroup = JSON.parse(JSON.stringify(old));
          
          const changes = onMutateBalances(variables, newGroup.members);
          changes.forEach((change) => {
            const member = newGroup.members.find((m: GroupDetailResponse['members'][0]) => m.id === change.member_id);
            if (member) {
              member.balance = (Number(member.balance) + change.net_change).toFixed(2);
            }
          });
          
          newGroup.simplified_debts = simplifyDebts(newGroup.members);
          return newGroup;
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
