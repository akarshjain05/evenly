import { useState, useEffect } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';

import { useParams } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { apiClient } from '../../api/client';
import type { GroupDetailResponse, SettlementCreate } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { useLedgerMutation } from '../../hooks/useLedgerMutation';
import { useQueryClient } from '@tanstack/react-query';
// 


export default function SettleUpModal({
  
  group }: { group: GroupDetailResponse }) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const { isSettleUpOpen, closeSettleUp, openSettleUp } = useUIStore();

  
  
  const [fromMember, setFromMember] = useState('');
  const [toMember, setToMember] = useState(group.members.length > 1 ? group.members[1].id : '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSettleUpOpen && !error) {
      setAmount('');
      setError('');
      const me = group.members.find(m => m.user_id === user?.id)?.id || group.members[0]?.id || '';
      setFromMember(me);
      setToMember(group.members.find(m => m.id !== me)?.id || '');
    }
  }, [isSettleUpOpen, group.members, user?.id]);

  
  const mutation = useLedgerMutation({
    mutationFn: (settlement: SettlementCreate) => apiClient.post(`groups/${id}/settlements`, settlement),

    onMutate: async (settlement: SettlementCreate) => {
      closeSettleUp();
      
      await queryClient.cancelQueries({ queryKey: ['group-activity', id] });
      const previousActivity = queryClient.getQueryData(['group-activity', id]);
      
      const optimisticItem = {
        id: `temp-${Date.now()}`,
        type: 'settlement',
        amount: settlement.amount,
        from_member: settlement.from_member,
        from_name: group.members.find(m => m.id === settlement.from_member)?.name || 'Unknown',
        to_member: settlement.to_member,
        to_name: group.members.find(m => m.id === settlement.to_member)?.name || 'Unknown',
        created_at: new Date().toISOString(),
        created_by_user_id: user?.id,
      };

      queryClient.setQueryData(['group-activity', id], (old: any) => {
        if (!old || !old.pages || !old.pages[0]) return old;
        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              items: [optimisticItem, ...old.pages[0].items]
            },
            ...old.pages.slice(1)
          ]
        };
      });

      return { previousActivity };
    },
    
    onSuccess: () => {
      setAmount('');
      setError('');
    },
    onError: (err: Error | any, _variables: any, context: any) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(['group-activity', id], context.previousActivity);
      }
      openSettleUp();
      setError((err.response?.data?.userMessage || err.response?.data?.detail) || 'Failed to record settlement');
    }
  });

  if (!isSettleUpOpen) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper text-ink rounded-[20px] shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 className="font-display text-[20px] font-medium m-0">Record a payment</h2>
          <button onClick={closeSettleUp} className="text-on-dark-soft hover:bg-paper-dim p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          setError('');
          if (fromMember === toMember) {
            setError("You can't settle up with yourself");
            return;
          }
          mutation.mutate({ from_member: fromMember, to_member: toMember, amount: parseFloat(amount) }); 
        }} className="p-5 space-y-4">
          
          {error && <div className="text-[#c81e1e] text-[13px] font-medium">{error}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Who paid?</label>
            <Select 
              value={fromMember} 
              onChange={setFromMember} 
              options={group.members.map(m => ({ value: m.id, label: m.user_id === user?.id ? 'You' : m.name }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Who received it?</label>
            <Select 
              value={toMember} 
              onChange={setToMember} 
              options={group.members.map(m => ({ value: m.id, label: m.user_id === user?.id ? 'You' : m.name }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Amount</label>
            <input type="number" required step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-field font-mono" placeholder="0.00" />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeSettleUp} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
