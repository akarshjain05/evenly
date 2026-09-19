import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import type { ActivityResponse, GroupDetailResponse } from '../../types/api';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import { simplifyDebts } from '../../utils/balances';

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
  const [participants, setParticipants] = useState<string[]>(
    expense.splits && expense.splits.length > 0
      ? expense.splits.map(s => s.member_id)
      : group.members.map(m => m.id)
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (updated: any) => apiClient.put(`groups/${id}/expenses/${expense.id}`, updated),
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ['group-activity', id] });
      await queryClient.cancelQueries({ queryKey: ['group', id] });

      const previousActivity = queryClient.getQueryData(['group-activity', id]);
      const payer = group.members.find(m => m.id === updated.paid_by);

      const parts = updated.participant_ids || group.members.map((m: any) => m.id);
      const share = parts.length > 0 ? updated.amount / parts.length : 0;
      const fakeSplits = parts.map((pid: string) => ({
        member_id: pid,
        name: group.members.find(m => m.id === pid)?.name || 'Unknown',
        share_amount: share.toFixed(2)
      }));

      queryClient.setQueryData(['group-activity', id], (old: any) =>
        old?.map((item: ActivityResponse) =>
          item.id === expense.id
            ? { ...item, description: updated.description, amount: updated.amount, paid_by_name: payer?.name ?? item.paid_by_name, paid_by: updated.paid_by, splits: fakeSplits }
            : item
        )
      );

      queryClient.setQueryData(['group', id], (old: any) => {
        if (!old) return old;
        const newGroup = JSON.parse(JSON.stringify(old));
        
        // 1. Revert old expense
        if (expense.splits && expense.splits.length > 0) {
            newGroup.members.forEach((m: any) => {
                let netChange = 0;
                if (m.id === expense.paid_by) netChange -= expense.amount;
                const split = expense.splits?.find((s: any) => s.member_id === m.id);
                if (split) netChange += Number(split.share_amount);
                m.balance = (Number(m.balance) + netChange).toString();
            });
        } else {
            const share = expense.amount / newGroup.members.length;
            newGroup.members.forEach((m: any) => {
                let netChange = 0;
                if (m.id === expense.paid_by) netChange -= expense.amount;
                netChange += share;
                m.balance = (Number(m.balance) + netChange).toString();
            });
        }

        // 2. Apply new expense
        if (updated.split_type === 'equal') {
            const parts = updated.participant_ids || newGroup.members.map((m: any) => m.id);
            if (parts.length > 0) {
                const share = updated.amount / parts.length;
                newGroup.members.forEach((m: any) => {
                    let netChange = 0;
                    if (m.id === updated.paid_by) netChange += updated.amount;
                    if (parts.includes(m.id)) netChange -= share;
                    m.balance = (Number(m.balance) + netChange).toString();
                });
            }
        }
        
        newGroup.simplified_debts = simplifyDebts(newGroup.members);
        return newGroup;
      });

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
      <div className="bg-paper text-ink rounded-[20px] shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b border-line-dark">
          <h2 className="font-display text-[20px] font-medium m-0">Edit expense</h2>
          <button onClick={onClose} className="text-on-dark-soft hover:bg-paper-dim p-1.5 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError('');
            if (participants.length === 0) {
              setError('Please select at least one person to split with.');
              return;
            }
            mutation.mutate({
              description,
              amount: parseFloat(amount),
              paid_by: paidBy,
              split_type: 'equal',
              participant_ids: participants,
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
