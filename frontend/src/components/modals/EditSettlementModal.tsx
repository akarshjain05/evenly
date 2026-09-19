import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { GroupDetailResponse, ActivityResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { simplifyDebts } from '../../utils/balances';
import { useLedgerMutation } from '../../hooks/useLedgerMutation';
// 


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
  
  const mutation = useLedgerMutation({
    mutationFn: (updated: any) => apiClient.put(`groups/${id}/settlements/${settlement.id}`, updated),
    onMutateActivity: (old, updated) => {
      const fromMemberObj = group.members.find(m => m.id === updated.from_member);
      const toMemberObj = group.members.find(m => m.id === updated.to_member);
      
      onClose();
      
      return old.map((item: ActivityResponse) =>
          item.id === settlement.id
            ? { ...item, amount: updated.amount, from_member: updated.from_member, to_member: updated.to_member, from_name: fromMemberObj?.name || 'Unknown', to_name: toMemberObj?.name || 'Unknown', paid_by_name: fromMemberObj?.name || 'Unknown' }
            : item
      );
    },
    onMutateBalances: (updated) => [
      { member_id: settlement.from_member, net_change: -settlement.amount },
      { member_id: settlement.to_member, net_change: settlement.amount },
      { member_id: updated.from_member, net_change: updated.amount },
      { member_id: updated.to_member, net_change: -updated.amount }
    ],
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to update settlement');
    }
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
