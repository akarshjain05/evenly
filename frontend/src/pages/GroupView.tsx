import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { GroupDetailResponse, ActivityResponse } from '../types/api';
import { useUIStore } from '../store/uiStore';
import { Plus, Handshake, Trash2 } from 'lucide-react';
import AddExpenseModal from '../components/modals/AddExpenseModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import { GroupViewSkeleton } from '../components/Skeleton';

const fetchGroupDetails = async (id: string): Promise<GroupDetailResponse> => {
  const { data } = await apiClient.get(`groups/${id}`);
  return data;
};

const fetchGroupActivity = async (id: string): Promise<ActivityResponse[]> => {
  const { data } = await apiClient.get(`groups/${id}/activity`);
  return data;
};

export default function GroupView() {
  const { id } = useParams<{ id: string }>();
  const { openAddExpense, openSettleUp } = useUIStore();
  const queryClient = useQueryClient();

  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', id],
    queryFn: () => fetchGroupDetails(id!),
    enabled: !!id,
  });

  const { data: activities, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['group-activity', id],
    queryFn: () => fetchGroupActivity(id!),
    enabled: !!id,
  });

  if (isLoadingGroup || isLoadingActivity) return <GroupViewSkeleton />;
  if (!group) return <div className="p-8 text-center text-red-500">Failed to load tab</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <AddExpenseModal group={group} />
      <SettleUpModal group={group} />
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-ink">{group.name}</h1>
            <button 
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`/api/groups/${id}/export/csv`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (!res.ok) throw new Error('Export failed');
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${group.name.replace(/\s+/g, '_')}_export.csv`;
                  a.click();
                } catch(e) {
                  alert('Export failed');
                }
              }}
              className="text-[12px] font-semibold text-brass hover:text-brass-deep transition-colors border border-brass px-2 py-0.5 rounded-md"
            >
              Export CSV
            </button>
          </div>
          <p className="text-sm text-on-dark-soft">Invite Code: <span className="font-mono font-medium text-ink">{group.invite_code}</span></p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={openSettleUp}
            className="flex items-center gap-2 px-4 py-2 border border-[#C19A5B] text-[#C19A5B] rounded-md hover:bg-orange-50 font-medium transition-colors"
          >
            <Handshake size={18} /> Settle Up
          </button>
          <button
            onClick={openAddExpense}
            className="flex items-center gap-2 px-4 py-2 bg-[#08060d] text-white rounded-md hover:bg-[#1a1625] font-medium transition-colors"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Activity</h2>
          <div className="space-y-4">
            {activities?.length === 0 && (
              <p className="text-gray-500 italic text-center py-8">No expenses yet.</p>
            )}
            {activities?.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm border border-[#e5e4e7]">
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-[#08060d]">{item.description}</h3>
                    {item.type === 'expense' && (
                      <button 
                        onClick={() => {
                          if (window.confirm('Delete this expense?')) {
                            apiClient.delete(`groups/${id}/expenses/${item.id}`).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['group', id] });
                              queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
                            });
                          }
                        }}
                        className="text-on-dark-soft hover:text-[#c81e1e] p-1 ml-2 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {item.type === 'expense' ? (
                      <>Paid by <span className="font-medium">{item.paid_by_name}</span></>
                    ) : (
                      <>{item.from_name} paid {item.to_name}</>
                    )}
                    <span className="mx-2">•</span>
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className={`font-semibold text-lg ${item.type === 'settlement' ? 'text-green-600' : 'text-[#08060d]'}`}>
                  ${item.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Balances</h2>
          <div className="bg-white rounded-lg shadow-sm border border-[#e5e4e7] p-4">
            <ul className="space-y-3">
              {group.members.map((m) => (
                <li key={m.id} className="flex justify-between items-center">
                  <span className="font-medium">{m.name}</span>
                  <span className={`font-semibold ${m.balance > 0 ? 'text-green-600' : m.balance < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {m.balance > 0 ? '+' : ''}{m.balance.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {group.simplified_debts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">How to settle up</h2>
              <div className="bg-white rounded-lg shadow-sm border border-[#e5e4e7] p-4">
                <ul className="space-y-3">
                  {group.simplified_debts.map((debt, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-semibold">{debt.from_name}</span> owes <span className="font-semibold">{debt.to_name}</span> <span className="font-semibold text-[#08060d]">${debt.amount.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
