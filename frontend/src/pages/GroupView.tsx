import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { GroupDetailResponse, ActivityResponse } from '../types/api';
import { useUIStore } from '../store/uiStore';
import { Plus, Handshake, Trash2, Share2, MoreVertical, Moon, Sun } from 'lucide-react';
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
  const { openAddExpense, openSettleUp, showAlert, showConfirm, showPrompt } = useUIStore();
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

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
    <div className="max-w-4xl mx-auto pb-20 p-6 sm:p-8">
      <AddExpenseModal group={group} />
      <SettleUpModal group={group} />
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-ink">{group.name}</h1>
          </div>
          <p className="text-sm text-on-dark-soft">Invite Code: <span className="font-mono font-medium text-ink">{group.invite_code}</span></p>
        </div>
        
        {/* TOP RIGHT CONTROLS */}
        <div className="flex gap-2 items-center relative">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          

          <button
            onClick={() => {
              const isDark = document.documentElement.classList.contains('dark');
              if (isDark) {
                document.documentElement.classList.remove('dark');
                localStorage.theme = 'light';
              } else {
                document.documentElement.classList.add('dark');
                localStorage.theme = 'dark';
              }
              // Force re-render to update icon (simplest way without global state for this specific button)
              window.dispatchEvent(new Event('theme-change'));
            }}
            className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer"
            title="Toggle Dark Mode"
          >
            <Moon className="hidden dark:block" size={20} />
            <Sun className="block dark:hidden" size={20} />
          </button>

          <button
            onClick={() => {
              const url = `${window.location.origin}/join/${group.invite_code}`;
              if (navigator.share) {
                navigator.share({ title: group.name, url });
              } else {
                navigator.clipboard.writeText(url);
                showAlert("Copied!", "Invite link copied to clipboard.");
              }
            }}
            className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer"
            title="Share Tab"
          >
            <Share2 size={20} />
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer"
          >
            <MoreVertical size={20} />
          </button>
          
          {showMenu && (
            <div className="absolute top-12 right-0 w-48 bg-paper border border-line-dark rounded-xl shadow-xl z-10 py-1">
              <button
                onClick={async () => {
                  setShowMenu(false);
                  const newName = await showPrompt("Rename Tab", group.name);
                  if (newName && newName !== group.name) {
                    try {
                      await apiClient.put(`groups/${id}`, { name: newName });
                      queryClient.invalidateQueries({ queryKey: ['group', id] });
                      queryClient.invalidateQueries({ queryKey: ['groups'] });
                    } catch (e) {
                      showAlert('Error', 'Failed to rename tab.');
                    }
                  }
                }}
                className="w-full text-left px-4 py-2 text-[14px] text-ink hover:bg-bg transition-colors"
              >
                Rename Tab
              </button>
              <button
                onClick={async () => {
                  setShowMenu(false);
                  try {
                    const res = await apiClient.get(`groups/${id}/export/csv`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${group.name.replace(/\s+/g, '_')}_export.csv`;
                    a.click();
                  } catch(e) {
                    showAlert('Export failed');
                  }
                }}
                className="w-full text-left px-4 py-2 text-[14px] text-ink hover:bg-bg transition-colors"
              >
                Export to CSV
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* ACTION BUTTONS (Moved down into feed column) */}
          <div className="flex gap-4">
            <button
              onClick={openAddExpense}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-opacity-90 font-medium transition-colors"
            >
              <Plus size={18} /> Add Expense
            </button>
            <button
              onClick={openSettleUp}
              className="flex-1 flex justify-center items-center gap-2 px-4 py-3 border border-primary text-primary rounded-xl hover:bg-primary hover:bg-opacity-10 font-medium transition-colors cursor-pointer bg-transparent"
            >
              <Handshake size={18} /> Settle Up
            </button>
          </div>

          <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
            <div className="px-6 py-5 border-b border-line-paper flex justify-between items-center">
               <h2 className="text-xl font-semibold m-0 text-ink">Activity</h2>
            </div>
            <div className="divide-y divide-line-paper">
              {activities?.length === 0 && (
                <p className="text-ink-soft italic text-center py-8">No expenses yet.</p>
              )}
              {activities?.map((item) => (
                <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4 hover:bg-bg transition-colors">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-ink m-0">{item.description}</h3>
                      <div className={`font-semibold ${item.type === 'settlement' ? 'text-primary' : 'text-ink'}`}>
                        ${Number(item.amount).toFixed(2)}
                      </div>
                    </div>
                    <p className="text-sm text-ink-soft m-0 flex justify-between">
                      <span>
                        {item.type === 'expense' ? (
                          <>Paid by <span className="font-medium">{item.paid_by_name}</span></>
                        ) : (
                          <>{item.from_name} paid {item.to_name}</>
                        )}
                      </span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </p>
                    
                    {item.type === 'expense' && (
                      <button 
                        onClick={async () => {
                          if (await showConfirm('Delete Expense', 'Are you sure you want to delete this expense?', { danger: true })) {
                            apiClient.delete(`groups/${id}/expenses/${item.id}`).then(() => {
                              queryClient.invalidateQueries({ queryKey: ['group', id] });
                              queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
                            });
                          }
                        }}
                        className="text-ink-soft hover:text-danger mt-1 transition-colors text-[12px] flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
            <div className="p-5 border-b border-line-paper">
              <h2 className="text-xl font-semibold m-0 text-ink">Balances</h2>
            </div>
            <div className="p-5 space-y-4">
              {group.members.map((m) => (
                <div key={m.id} className="flex justify-between items-center">
                  <span className="font-medium text-ink">{m.name}</span>
                  <span className={`font-semibold ${Number(m.balance) > 0 ? 'text-primary' : Number(m.balance) < 0 ? 'text-danger' : 'text-ink-soft'}`}>
                    {Number(m.balance) > 0 ? '+' : ''}{Number(m.balance).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {group.simplified_debts.length > 0 && (
            <div className="bg-paper rounded-2xl border border-line-paper overflow-hidden">
              <div className="p-5 border-b border-line-paper">
                <h2 className="text-xl font-semibold m-0 text-ink">How to settle up</h2>
              </div>
              <div className="p-5 space-y-4">
                {group.simplified_debts.map((debt, i) => (
                  <div key={i} className="text-sm text-ink-soft flex justify-between items-center">
                    <span>
                      <span className="font-semibold text-ink">{debt.from_name}</span> owes <span className="font-semibold text-ink">{debt.to_name}</span>
                    </span>
                    <span className="font-semibold text-ink">${Number(debt.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
