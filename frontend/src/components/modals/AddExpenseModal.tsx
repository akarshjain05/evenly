import { useState, useEffect } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';

import { useParams } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import type { GroupDetailResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { addExpense } from '../../db/mutations';
export default function AddExpenseModal({
  group }: { group: GroupDetailResponse }) {
  const { data: user } = useCurrentUser();
  const { id } = useParams<{ id: string }>();
  const { isAddExpenseOpen, closeAddExpense } = useUIStore();

  
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [participants, setParticipants] = useState<string[]>(group.members.map(m => m.id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAddExpenseOpen) {
      setDescription('');
      setAmount('');
      setError('');
      setPaidBy(group.members.find(m => m.user_id === user?.id)?.id || group.members[0]?.id || '');
      setParticipants(group.members.map(m => m.id));
    }
  }, [isAddExpenseOpen, group.members, user?.id]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(''); 
    if (!description.trim()) {
      setError('Please enter a description.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (participants.length === 0) {
      setError('Please select at least one person to split with.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addExpense(id!, { description: description.trim(), amount: parsedAmount, paid_by: paidBy, split_type: 'equal', participant_ids: participants }, user?.id || null);
      closeAddExpense();
      setDescription('');
      setAmount('');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddExpenseOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="add-expense-title" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper text-ink rounded-[20px] shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 id="add-expense-title" className="font-display text-[20px] font-medium m-0">Add an expense</h2>
          <button onClick={closeAddExpense} aria-label="Close" className="text-on-dark-soft hover:bg-paper-dim p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          handleSubmit();
        }} className="p-5 space-y-4">
          {error && <div className="text-[#c81e1e] text-[13px] font-medium">{error}</div>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-description" className="text-[13px] text-ink-soft">Description</label>
            <input id="expense-description" type="text" required value={description} onChange={e => setDescription(e.target.value)} className="input-field" aria-invalid={!!error} aria-describedby={error ? "add-expense-error" : undefined} placeholder="Dinner at Joe's" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="expense-amount" className="text-[13px] text-ink-soft">Amount</label>
            <input id="expense-amount" type="number" required step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-field font-mono" placeholder="0.00" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Paid by</label>
            <Select 
              value={paidBy} 
              onChange={setPaidBy} 
              options={group.members.map(m => ({ value: m.id, label: m.user_id === user?.id ? 'You' : m.name }))}
            />
          </div>
          
          <div className="flex flex-col gap-2 pt-2 border-t border-line-dark mt-2">
            <label className="text-[13px] text-ink-soft mt-2">Split equally between</label>
            <div className="flex flex-wrap gap-2">
              {group.members.map(m => (
                <label key={m.id} className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border transition-colors ${participants.includes(m.id) ? 'bg-primary border-primary text-white' : 'bg-bg border-line-dark text-ink hover:border-primary/50'}`}>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={participants.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) setParticipants([...participants, m.id]);
                      else setParticipants(participants.filter(id => id !== m.id));
                    }}
                  />
                  <span className="text-[14px] font-medium">{m.user_id === user?.id ? 'You' : m.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={closeAddExpense} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
