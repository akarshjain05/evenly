import { useState, useEffect } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';

import { useParams } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import type { GroupDetailResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { addSettlement } from '../../db/mutations';
export default function SettleUpModal({
  group }: { group: GroupDetailResponse }) {
  const { data: user } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const { isSettleUpOpen, closeSettleUp } = useUIStore();

  
  
  const [fromMember, setFromMember] = useState('');
  const [toMember, setToMember] = useState(group.members.length > 1 ? group.members[1].id : '');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSettleUpOpen) {
      setAmount('');
      setError('');
      const me = group.members.find(m => m.user_id === user?.id)?.id || group.members[0]?.id || '';
      setFromMember(me);
      setToMember(group.members.find(m => m.id !== me)?.id || '');
    }
  }, [isSettleUpOpen, group.members, user?.id]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (fromMember === toMember) {
      setError("You can't settle up with yourself");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addSettlement(id!, { from_member: fromMember, to_member: toMember, amount: parseFloat(amount) }, user?.id || null);
      closeSettleUp();
      setAmount('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to record settlement');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          handleSubmit();
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
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeSettleUp} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
