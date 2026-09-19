import { formatCurrency } from '../utils/currency';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { GroupDetailResponse, ActivityResponse } from '../types/api';
import { useUIStore } from '../store/uiStore';
import { Plus, Handshake, Trash2, Pencil, MoreVertical } from 'lucide-react';
import AddExpenseModal from '../components/modals/AddExpenseModal';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import EditSettlementModal from '../components/modals/EditSettlementModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import ShareModal from '../components/modals/ShareModal';
import { simplifyDebts } from '../utils/balances';
import { GroupViewSkeleton } from '../components/Skeleton';
import { GroupHeader } from '../components/group/GroupHeader';
import { BalancesSidebar } from '../components/group/BalancesSidebar';
import { SettleSuggestions } from '../components/group/SettleSuggestions';

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
  
  const { openAddExpense, openSettleUp, showAlert, showConfirm } = useUIStore();
  const queryClient = useQueryClient();
  
    
  
  const [editingExpense, setEditingExpense] = useState<ActivityResponse | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<ActivityResponse | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'expenses' | 'settlements'>('expenses');


  

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
                <div key={item.id} className="p-4 sm:p-6 flex items-start gap-4 hover:bg-bg transition-colors relative last:rounded-b-2xl">
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
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="text-[13px] text-ink-soft leading-none">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
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
                                      
                                      const oldActivity = queryClient.getQueryData(['group-activity', id]);
                                      queryClient.setQueryData(['group-activity', id], (old: any) => {
                                        if (!old) return old;
                                        return old.filter((a: any) => a.id !== item.id);
                                      });
                                      
                                      apiClient.delete(`groups/${id}/expenses/${item.id}`)
                                        .then(() => {
                                          queryClient.invalidateQueries({ queryKey: ['group', id] });
                                          queryClient.invalidateQueries({ queryKey: ['group-activity', id] });
                                        })
                                        .catch(() => {
                                          queryClient.setQueryData(['group-activity', id], oldActivity);
                                          queryClient.invalidateQueries({ queryKey: ['group', id] });
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
      {editingSettlement && (
        <EditSettlementModal
          settlement={editingSettlement}
          group={group}
          onClose={() => setEditingSettlement(null)}
        />
      )}
      {isShareOpen && (
        <ShareModal
          group={group}
          onClose={() => setIsShareOpen(false)}
        />
      )}
      
      <GroupHeader group={group} id={id} setIsShareOpen={setIsShareOpen} />

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
              className="flex-1 flex justify-center items-center gap-2 px-4 py-3 border border-primary text-primary rounded-xl hover:opacity-70 font-medium transition-colors cursor-pointer bg-transparent"
            >
              <Handshake size={18} /> Settle Up
            </button>
          </div>

          <div className="bg-paper rounded-2xl border border-line-paper overflow-visible">
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-line-paper flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h2 className="text-xl font-semibold m-0 text-ink">Activity</h2>
               
               <div className="flex bg-bg-soft rounded-full p-1 gap-1 w-full sm:w-auto min-w-[220px] border border-line-dark shadow-sm">
                <button 
                  onClick={() => setActiveActivityTab('expenses')}
                  className={`flex-1 sm:px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border-none cursor-pointer ${activeActivityTab === 'expenses' ? 'bg-primary text-white shadow-sm' : 'text-ink-soft hover:text-ink bg-transparent'}`}
                >
                  Payments
                </button>
                <button 
                  onClick={() => setActiveActivityTab('settlements')}
                  className={`flex-1 sm:px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border-none cursor-pointer ${activeActivityTab === 'settlements' ? 'bg-primary text-white shadow-sm' : 'text-ink-soft hover:text-ink bg-transparent'}`}
                >
                  Settlements
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-line-paper">
              {activeActivityTab === 'expenses' ? (
                <>
                  {expenses.length === 0 && (
                    <p className="text-ink-soft italic text-center py-8 text-[15px]">No normal payments yet.</p>
                  )}
                  {expenses.map(renderActivityItem)}
                </>
              ) : (
                <>
                  {settlements.length === 0 && (
                    <p className="text-ink-soft italic text-center py-8 text-[15px]">No settlements yet.</p>
                  )}
                  {settlements.map(renderActivityItem)}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <BalancesSidebar group={group} getDisplayName={getDisplayName} />

          <SettleSuggestions group={group} getDisplayName={getDisplayName} />
        </div>
      </div>
    </div>
  );
}
