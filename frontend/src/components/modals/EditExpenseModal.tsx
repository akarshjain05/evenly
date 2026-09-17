import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { ActivityResponse, GroupDetailResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';

interface Props {
  expense: ActivityResponse;
  group: GroupDetailResponse;
  onClose: () => void;
}

export default function EditExpenseModal({ expense, group, onClose }: Props) {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [paidBy, setPaidBy] = useState(expense.paid_by || group.members[0]?.id || '');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (updated: any) => apiClient.put(`groups/${id}/expenses/${expense.id}`, updated),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['group-activity', id] });
      await queryClient.cancelQueries({ queryKey: ['group', id] });

      const previousActivity = queryClient.getQueryData(['group-activity', id]);
      const payer = group.members.find(m => m.id === updated.paid_by);

      queryClient.setQueryData(['group-activity', id], (old: any) =>
        old?.map((item: ActivityResponse) =>
          item.id === expense.id
            ? { ...item, description: updated.description, amount: updated.amount, paid_by_name: payer?.name ?? item.paid_by_name, paid_by: updated.paid_by }
            : item
        )
      );

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
      setError(typeof detail === 'string' ? detail : 'Failed to update expense');
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper text-ink rounded-[20px] shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 className="font-display text-[20px] font-medium m-0">Edit expense</h2>
          <button onClick={onClose} className="text-on-dark-soft hover:bg-paper-dim p-1.5 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            mutation.mutate({
              description,
              amount: parseFloat(amount),
              paid_by: paidBy,
              split_type: expense.split_type || 'equal',
              category: expense.category || 'General',
            });
          }}
          className="p-5 space-y-4"
        >
          {error && <div className="text-[#c81e1e] text-[13px] font-medium">{error}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Description</label>
            <input type="text" required value={description} onChange={e => setDescription(e.target.value)} className="input-field" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft">Amount (₹)</label>
            <input type="number" required step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-field font-mono" />
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
