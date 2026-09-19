import { useState } from 'react';

import { useParams } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { apiClient } from '../../api/client';
import type { GroupDetailResponse, SettlementCreate } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { useLedgerMutation } from '../../hooks/useLedgerMutation';
// 


export default function SettleUpModal({ group }: { group: GroupDetailResponse }) {
  const { id } = useParams<{ id: string }>();
  const { isSettleUpOpen, closeSettleUp, openSettleUp } = useUIStore();

  
  
  const [fromMember, setFromMember] = useState(group.members[0]?.id || '');
  const [toMember, setToMember] = useState(group.members.length > 1 ? group.members[1].id : '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  
  const mutation = useLedgerMutation({
    mutationFn: (settlement: SettlementCreate) => apiClient.post(`groups/${id}/settlements`, settlement),
    onMutateActivity: (old, settlement: SettlementCreate) => {
      const fromMemberObj = group.members.find(m => m.id === settlement.from_member);
      const toMemberObj = group.members.find(m => m.id === settlement.to_member);
      const fakeId = `temp-${Date.now()}`;
      
      const optimisticActivity = {
        id: fakeId,
        type: 'settlement',
        description: 'Payment',
        amount: settlement.amount,
        paid_by_name: '',
        from_name: fromMemberObj ? fromMemberObj.name : 'Unknown',
        to_name: toMemberObj ? toMemberObj.name : 'Unknown',
        from_member: settlement.from_member,
        to_member: settlement.to_member,
        created_at: new Date().toISOString(),
      };

      closeSettleUp();
      setAmount('');
      setError('');

      return [optimisticActivity, ...old];
    },
    onMutateBalances: (settlement: SettlementCreate) => [
      { member_id: settlement.from_member, net_change: settlement.amount },
      { member_id: settlement.to_member, net_change: -settlement.amount }
    ],
    onError: (err: Error | any) => {
      openSettleUp();
      setError(err.response?.data?.detail || 'Failed to record settlement');
    }
  });

  if (!isSettleUpOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
              options={group.members.map(m => ({ value: m.id, label: m.name }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Who received it?</label>
            <Select 
              value={toMember} 
              onChange={setToMember} 
              options={group.members.map(m => ({ value: m.id, label: m.name }))}
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
