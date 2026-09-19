import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { GroupDetailResponse, ActivityResponse } from '../types/api';
import { useUIStore } from '../store/uiStore';
import { Plus, Handshake, Trash2, Pencil, Share2, MoreVertical, Moon, Sun } from 'lucide-react';
import AddExpenseModal from '../components/modals/AddExpenseModal';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import ShareModal from '../components/modals/ShareModal';
import { simplifyDebts } from '../utils/balances';
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
  const navigate = useNavigate();
  const { openAddExpense, openSettleUp, showAlert, showConfirm, showPrompt } = useUIStore();
  const queryClient = useQueryClient();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ActivityResponse | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

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

  const { data: user } = useQuery({ queryKey: ['me'], queryFn: async () => (await apiClient.get('users/me')).data });

  const { data: group, isLoading: isLoadingGroup } = useQuery({
    queryKey: ['group', id],
    queryFn: () => fetchGroupDetails(id!),
    enabled: !!id,
  });

  const getDisplayName = (memberId: string | null | undefined, fallbackName: string | null | undefined) => {
    if (!memberId) return fallbackName || 'Unknown';
    const member = group?.members.find(m => m.id === memberId);
    if (member && user && member.user_id === user.id) {
      return 'You';
    }
    return fallbackName || member?.name || 'Unknown';
  };

  const { data: activities, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['group-activity', id],
    queryFn: () => fetchGroupActivity(id!),
    enabled: !!id,
  });

  if (isLoadingGroup || isLoadingActivity) return <GroupViewSkeleton />;
  if (!group) return <div className="p-8 text-center text-red-500">Failed to load tab</div>;

  const expenses = activities?.filter(a => a.type === 'expense') || [];
  const settlements = activities?.filter(a => a.type === 'settlement') || [];

  const renderActivityItem = (item: any) => (
                <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4 hover:bg-bg transition-colors relative">
                  <div className="flex-1 flex justify-between items-start gap-4 min-w-0">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-medium text-ink m-0 truncate">
                        {item.type === 'expense' 
                          ? item.description 
                          : `${getDisplayName(item.from_member, item.from_name)} paid ${getDisplayName(item.to_member, item.to_name)}`
                        }
                      </h3>
                      <p className="text-sm text-ink-soft m-0 truncate">
                        {item.type === 'expense' ? (
                          <>Paid by <span className="font-medium">{getDisplayName(item.paid_by, item.paid_by_name)}</span></>
                        ) : (
                          'Settlement'
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-1 shrink-0">
                      <div className="text-right space-y-1">
                        <div className={`font-semibold leading-none ${item.type === 'settlement' ? 'text-primary' : 'text-ink'}`}>
                          ₹{Number(item.amount).toFixed(2)}
                        </div>
                        <div className="text-[13px] text-ink-soft leading-none">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {item.type === 'expense' ? (
                        <div className="relative -mt-0.5 -mr-1.5">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === item.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-7 w-36 bg-paper border border-line-dark rounded-xl shadow-xl z-20 py-1">
                                <button
                                  onClick={() => { setOpenMenuId(null); setEditingExpense(item); }}
                                  className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg transition-colors flex items-center gap-2"
                                >
                                  <Pencil size={13} /> Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    setOpenMenuId(null);
                                    if (await showConfirm('Delete Expense', 'Are you sure you want to delete this expense?', { danger: true })) {
                                      queryClient.setQueryData(['group-activity', id], (old: any) =>
                                        old?.filter((a: ActivityResponse) => a.id !== item.id)
                                      );
                                      queryClient.setQueryData(['group', id], (old: any) => {
                                        if (!old) return old;
                                        const newGroup = JSON.parse(JSON.stringify(old));
                                        
                                        if (item.splits && item.splits.length > 0) {
                                            newGroup.members.forEach((m: any) => {
                                                let netChange = 0;
                                                if (m.id === item.paid_by) netChange -= item.amount;
                                                const split = item.splits?.find((s: any) => s.member_id === m.id);
                                                if (split) netChange += Number(split.share_amount);
                                                m.balance = (Number(m.balance) + netChange).toString();
                                            });
                                        } else {
                                            const share = item.amount / newGroup.members.length;
                                            newGroup.members.forEach((m: any) => {
                                                let netChange = 0;
                                                if (m.id === item.paid_by) netChange -= item.amount;
                                                netChange += share;
                                                m.balance = (Number(m.balance) + netChange).toString();
                                            });
                                        }
                                        newGroup.simplified_debts = simplifyDebts(newGroup.members);
                                        return newGroup;
                                      });
                                      apiClient.delete(`groups/${id}/expenses/${item.id}`)
                                        .then(() => {
                                          queryClient.invalidateQueries({ queryKey: ['group', id] });
                                          queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
                                        })
                                        .catch(() => {
                                          queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
                                          showAlert('Error', 'Failed to delete expense.');
                                        });
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 text-[13px] text-danger hover:bg-bg transition-colors flex items-center gap-2"
                                >
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="w-[24px]"></div>
                      )}
                    </div>
                  </div>
                </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <AddExpenseModal group={group} />
      <SettleUpModal group={group} />
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          group={group}
          onClose={() => setEditingExpense(null)}
        />
      )}
      {isShareOpen && (
        <ShareModal
          group={group}
          onClose={() => setIsShareOpen(false)}
        />
      )}
      
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
            onClick={() => setIsShareOpen(true)}
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
                    } catch (e: any) {
                      showAlert('Error', e.response?.data?.detail || 'Failed to rename tab.');
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
              <button
                onClick={async () => {
                  setShowMenu(false);
                  const confirmed = await showConfirm("Delete Tab", "Are you sure you want to delete this tab? This will permanently delete all expenses and settlements. This action cannot be undone.");
                  if (confirmed) {
                    setIsDeleting(true);
                    try {
                      await apiClient.delete(`groups/${id}`);
                      queryClient.setQueryData(['groups'], (old: any) => old?.filter((m: any) => m.group.id !== id));
                      queryClient.invalidateQueries({ queryKey: ['groups'] });
                      navigate('/', { replace: true });
                    } catch (e: any) {
                      showAlert('Error', e.response?.data?.detail || 'Failed to delete tab. Only the creator can delete it.');
                      setIsDeleting(false);
                    }
                  }
                }}
                className="w-full text-left px-4 py-2 text-[14px] text-[#c81e1e] hover:bg-bg transition-colors"
              >
                Delete Tab
              </button>
            </div>
          )}
        </div>
      </div>

      {isDeleting && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-line-dark border-t-[#c81e1e] animate-spin"></div>
            <div className="text-ink font-medium text-[15px]">Deleting tab...</div>
          </div>
        </div>
      )}

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
                        
            <div className="bg-bg-soft px-6 py-2 border-b border-line-paper">
              <h3 className="text-[13px] font-semibold text-ink-soft tracking-wider uppercase m-0">Normal Payments</h3>
            </div>
            <div className="divide-y divide-line-paper">
              {expenses.length === 0 && (
                <p className="text-ink-soft italic text-center py-6 text-[15px]">No normal payments yet.</p>
              )}
              {expenses.map(renderActivityItem)}
            </div>

            <div className="bg-bg-soft px-6 py-2 border-y border-line-paper mt-2">
              <h3 className="text-[13px] font-semibold text-ink-soft tracking-wider uppercase m-0">Settlements</h3>
            </div>
            <div className="divide-y divide-line-paper">
              {settlements.length === 0 && (
                <p className="text-ink-soft italic text-center py-6 text-[15px]">No settlements yet.</p>
              )}
              {settlements.map(renderActivityItem)}
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
                  <span className="font-medium text-ink">{getDisplayName(m.id, m.name)}</span>
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
                      <span className="font-semibold text-ink">{getDisplayName(debt.from_member, debt.from_name)}</span> {getDisplayName(debt.from_member, debt.from_name) === 'You' ? 'owe' : 'owes'} <span className="font-semibold text-ink">{getDisplayName(debt.to_member, debt.to_name)}</span>
                    </span>
                    <span className="font-semibold text-ink">₹{Number(debt.amount).toFixed(2)}</span>
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
