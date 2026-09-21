import { useState } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';

import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { GroupDetailResponse, SettlementCreate, ActivityResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { useLedgerMutation } from '../../hooks/useLedgerMutation';
// 


interface Props {
  settlement: ActivityResponse;
  group: GroupDetailResponse;
  onClose: () => void;
}

export default function EditSettlementModal({
  settlement, group, onClose }: Props) {
  const { data: user } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  
  
  const [fromMember, setFromMember] = useState(settlement.from_member || '');
  const [toMember, setToMember] = useState(settlement.to_member || '');
  const [amount, setAmount] = useState(String(settlement.amount));
  const [error, setError] = useState('');
  
  const mutation = useLedgerMutation({
    mutationFn: (updated: SettlementCreate) => apiClient.put(`groups/${id}/settlements/${settlement.id}`, updated),
    
    onSuccess: () => {
      onClose();
    },
    onError: (err: Error | any) => {
      const detail = err.response?.data?.userMessage || err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to update settlement');
    }
  });

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
              options={group.members.map((m: GroupDetailResponse['members'][0]) => ({ value: m.id, label: m.user_id === user?.id ? 'You' : m.name }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">To</label>
            <Select
              value={toMember}
              onChange={setToMember}
              options={group.members.map((m: GroupDetailResponse['members'][0]) => ({ value: m.id, label: m.user_id === user?.id ? 'You' : m.name }))}
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
