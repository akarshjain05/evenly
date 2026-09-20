import { calculateEqualSplits, calculateExpenseBalanceChanges } from '../../utils/balances';
import { useState } from 'react';

import { useParams } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { apiClient } from '../../api/client';
import type { ExpenseCreate, GroupDetailResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { useLedgerMutation } from '../../hooks/useLedgerMutation';
//


export default function AddExpenseModal({ group }: { group: GroupDetailResponse }) {
  const { id } = useParams<{ id: string }>();
  const { isAddExpenseOpen, closeAddExpense, openAddExpense } = useUIStore();

  
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0]?.id || '');
  const [participants, setParticipants] = useState<string[]>(group.members.map(m => m.id));
  const [error, setError] = useState('');
  
  const mutation = useLedgerMutation({
    mutationFn: (newExpense: ExpenseCreate) => apiClient.post(`groups/${id}/expenses`, newExpense),
    onMutateActivity: (old, newExpense) => {
      const payer = group.members.find(m => m.id === newExpense.paid_by);
      const fakeId = `temp-${Date.now()}`;
      
      const parts = newExpense.participant_ids || group.members.map((m: GroupDetailResponse['members'][0]) => m.id);
      const fakeSplits = calculateEqualSplits(newExpense.amount, parts).map(s => ({
        ...s,
        name: group.members.find((m: GroupDetailResponse['members'][0]) => m.id === s.member_id)?.name || 'Unknown'
      }));
      
      const optimisticActivity = {
        id: fakeId,
        type: 'expense',
        description: newExpense.description,
        amount: newExpense.amount,
        paid_by: newExpense.paid_by,
        paid_by_name: payer ? payer.name : 'Unknown',
        created_at: new Date().toISOString(),
        split_type: newExpense.split_type,
        splits: fakeSplits
      };
      
      closeAddExpense();
      setDescription('');
      setAmount('');
      setError('');
      setParticipants(group.members.map(m => m.id));
      
      return [optimisticActivity, ...old];
    },
    onMutateBalances: (newExpense, members) => {
      return calculateExpenseBalanceChanges(members, newExpense);
    },
    onError: (err: any) => {
      openAddExpense();
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to save expense'));
    }
  });

  if (!isAddExpenseOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper text-ink rounded-[20px] shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 className="font-display text-[20px] font-medium m-0">Add an expense</h2>
          <button onClick={closeAddExpense} className="text-on-dark-soft hover:bg-paper-dim p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <form onSubmit={(e) => { 
          e.preventDefault(); 
          setError(''); 
          if (participants.length === 0) {
            setError('Please select at least one person to split with.');
            return;
          }
          mutation.mutate({ description, amount: parseFloat(amount), paid_by: paidBy, split_type: 'equal', participant_ids: participants }); 
        }} className="p-5 space-y-4">
          {error && <div className="text-[#c81e1e] text-[13px] font-medium">{error}</div>}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Description</label>
            <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="input-field" placeholder="Dinner at Joe's" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Amount</label>
            <input type="number" required step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-field font-mono" placeholder="0.00" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Paid by</label>
            <Select 
              value={paidBy} 
              onChange={setPaidBy} 
              options={group.members.map(m => ({ value: m.id, label: m.name }))}
            />
          </div>
          
          <div className="flex flex-col gap-2 pt-2 border-t border-line-dark mt-2">
            <label className="text-[13px] text-ink-soft mt-2">Split equally between</label>
            <div className="flex flex-wrap gap-2">
              {group.members.map(m => (
                <label key={m.id} className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full border transition-colors ${participants.includes(m.id) ? 'bg-primary border-primary text-white' : 'bg-bg border-line-dark text-ink hover:border-primary/50'}`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={participants.includes(m.id)}
                    onChange={(e) => {
                      if (e.target.checked) setParticipants([...participants, m.id]);
                      else setParticipants(participants.filter(id => id !== m.id));
                    }}
                  />
                  <span className="text-[14px] font-medium">{m.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={closeAddExpense} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
