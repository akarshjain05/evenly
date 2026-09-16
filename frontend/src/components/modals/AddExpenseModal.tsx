import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { apiClient } from '../../api/client';
import type { ExpenseCreate, GroupDetailResponse } from '../../types/api';
import { X } from 'lucide-react';

export default function AddExpenseModal({ group }: { group: GroupDetailResponse }) {
  const { id } = useParams<{ id: string }>();
  const { isAddExpenseOpen, closeAddExpense } = useUIStore();
  const queryClient = useQueryClient();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0]?.id || '');
  
  const mutation = useMutation({
    mutationFn: (newExpense: ExpenseCreate) => apiClient.post(`/groups/${id}/expenses`, newExpense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
      closeAddExpense();
      setDescription('');
      setAmount('');
    },
  });

  if (!isAddExpenseOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Add an expense</h2>
          <button onClick={closeAddExpense} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full"><X size={20}/></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate({ description, amount: parseFloat(amount), paid_by: paidBy, split_type: 'equal' }); }} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="Dinner at Joe's" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input type="number" required step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paid by</label>
            <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              {group.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          
          <div className="pt-4 border-t flex justify-end gap-3">
            <button type="button" onClick={closeAddExpense} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-[#08060d] text-white rounded-md hover:bg-[#1a1625]">
              {mutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
