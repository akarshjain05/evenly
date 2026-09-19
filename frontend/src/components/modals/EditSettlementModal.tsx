import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { GroupDetailResponse, ActivityResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { simplifyDebts } from '../../utils/balances';

interface Props {
  settlement: ActivityResponse;
  group: GroupDetailResponse;
  onClose: () => void;
}

export default function EditSettlementModal({ settlement, group, onClose }: Props) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [fromMember, setFromMember] = useState(settlement.from_member || '');
  const [toMember, setToMember] = useState(settlement.to_member || '');
  const [amount, setAmount] = useState(String(settlement.amount));
  const [error, setError] = useState('');
  
  const mutation = useMutation({
    mutationFn: (updated: any) => apiClient.put(`groups/${id}/settlements/${settlement.id}`, updated),
    onMutate: async (updated: any) => {
      await queryClient.cancelQueries({ queryKey: ['group-activity', id] });
      await queryClient.cancelQueries({ queryKey: ['group', id] });
      
      const previousActivity = queryClient.getQueryData(['group-activity', id]);
      
      const fromMemberObj = group.members.find(m => m.id === updated.from_member);
      const toMemberObj = group.members.find(m => m.id === updated.to_member);
      
      queryClient.setQueryData(['group-activity', id], (old: any) =>
        old?.map((item: ActivityResponse) =>
          item.id === settlement.id
            ? { ...item, amount: updated.amount, from_member: updated.from_member, to_member: updated.to_member, from_name: fromMemberObj?.name || 'Unknown', to_name: toMemberObj?.name || 'Unknown', paid_by_name: fromMemberObj?.name || 'Unknown' }
            : item
        )
      );

      queryClient.setQueryData(['group', id], (old: any) => {
        if (!old) return old;
        const newGroup = JSON.parse(JSON.stringify(old));
        
        // 1. Revert old settlement
        newGroup.members.forEach((m: any) => {
            if (m.id === settlement.from_member) m.balance = (Number(m.balance) - settlement.amount).toString();
            if (m.id === settlement.to_member) m.balance = (Number(m.balance) + settlement.amount).toString();
        });

        // 2. Apply new settlement
        newGroup.members.forEach((m: any) => {
            if (m.id === updated.from_member) m.balance = (Number(m.balance) + updated.amount).toString();
            if (m.id === updated.to_member) m.balance = (Number(m.balance) - updated.amount).toString();
        });
        
        newGroup.simplified_debts = simplifyDebts(newGroup.members);
        return newGroup;
      });

      onClose();
      return { previousActivity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
    },
    onError: (err: any, _vars: any, context: any) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(['group-activity', id], context.previousActivity);
        queryClient.invalidateQueries({ queryKey: ['group', id] });
      }
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to update settlement');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper text-ink rounded-[20px] shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 className="font-display text-[20px] font-medium m-0">Edit settlement</h2>
          <button onClick={onClose} className="text-on-dark-soft hover:bg-paper-dim p-1.5 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            if (fromMember === toMember) {
              setError("Sender and receiver cannot be the same person");
              return;
            }
            if (parseFloat(amount) <= 0) {
              setError("Amount must be greater than 0");
              return;
            }
            mutation.mutate({
              from_member: fromMember,
              to_member: toMember,
              amount: parseFloat(amount),
            });
          }}
          className="p-5 space-y-4"
        >
          {error && <div className="text-[#c81e1e] text-[13px] font-medium">{error}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">From</label>
            <Select
              value={fromMember}
              onChange={setFromMember}
              options={group.members.map((m: any) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">To</label>
            <Select
              value={toMember}
              onChange={setToMember}
              options={group.members.map((m: any) => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Amount (₹)</label>
            <input 
              type="number" 
              required 
              step="0.01" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="input-field font-mono" 
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
