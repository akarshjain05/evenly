import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { apiClient } from '../../api/client';
import type { ExpenseCreate, GroupDetailResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';

export default function AddExpenseModal({ group }: { group: GroupDetailResponse }) {
  const { id } = useParams<{ id: string }>();
  const { isAddExpenseOpen, closeAddExpense } = useUIStore();
  const queryClient = useQueryClient();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0]?.id || '');
  const [error, setError] = useState('');
  
  const mutation = useMutation({
    mutationFn: (newExpense: ExpenseCreate) => apiClient.post(`groups/${id}/expenses`, newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
      closeAddExpense();
      setDescription('');
      setAmount('');
      setError('');
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'Failed to save expense'));
    }
  });

  if (!isAddExpenseOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper text-ink rounded-[20px] shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 className="font-display text-[20px] font-medium m-0">Add an expense</h2>
          <button onClick={closeAddExpense} className="text-on-dark-soft hover:bg-paper-dim p-1.5 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate({ description, amount: parseFloat(amount), paid_by: paidBy, split_type: 'equal' }); }} className="p-5 space-y-4">
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
