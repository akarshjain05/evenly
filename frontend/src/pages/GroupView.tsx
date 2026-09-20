import { formatCurrency } from '../utils/currency';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { apiClient } from '../api/client';
import type { GroupDetailResponse, ActivityResponse } from '../types/api';
import { useUIStore } from '../store/uiStore';
import { Plus, Handshake, Trash2, Pencil, MoreVertical } from 'lucide-react';
import AddExpenseModal from '../components/modals/AddExpenseModal';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import EditSettlementModal from '../components/modals/EditSettlementModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import ShareModal from '../components/modals/ShareModal';
import { useLedgerMutation } from '../hooks/useLedgerMutation';
import { GroupViewSkeleton } from '../components/Skeleton';
import { GroupHeader } from '../components/group/GroupHeader';
import { BalancesSidebar } from '../components/group/BalancesSidebar';
import { SettleSuggestions } from '../components/group/SettleSuggestions';
import { calculateExpenseBalanceChanges } from '../utils/balances';

const fetchGroupDetails = async (id: string): Promise<GroupDetailResponse> => {
  const { data } = await apiClient.get(`groups/${id}`);
  return data;
};

const fetchGroupActivity = async (id: string, pageParam?: string): Promise<ActivityResponse[]> => {
  const url = pageParam ? `groups/${id}/activity?last_seen=${encodeURIComponent(pageParam)}` : `groups/${id}/activity`;
  const { data } = await apiClient.get(url);
  return data;
};


export default function GroupView() {
  const { id } = useParams<{ id: string }>();
  
  const { openAddExpense, openSettleUp, showAlert, showConfirm } = useUIStore();
  
  
    
  

  const [editingExpense, setEditingExpense] = useState<ActivityResponse | null>(null);
  
  const deleteMutation = useLedgerMutation({
    mutationFn: (item: ActivityResponse) => apiClient.delete(`groups/${id}/expenses/${item.id}`),
    onMutateActivity: (old, item) => old.filter((a: ActivityResponse) => a.id !== item.id),
    onMutateBalances: (item, members) => {
      return calculateExpenseBalanceChanges(members, undefined, item);
    },
    onError: () => showAlert('Error', 'Failed to delete expense.')
  });

  const [editingSettlement, setEditingSettlement] = useState<ActivityResponse | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'expenses' | 'settlements'>('expenses');


  

  const { data: user } = useCurrentUser();

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

  const { 
    data: activityData, 
    isLoading: isLoadingActivity,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['group-activity', id],
    queryFn: ({ pageParam }) => fetchGroupActivity(id!, pageParam as string | undefined),
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 50) return undefined;
      const lastItem = lastPage[lastPage.length - 1];
      return `${lastItem.created_at}|${lastItem.id}`;
    },
    enabled: !!id,
    initialPageParam: undefined as string | undefined,
  });

  const activities = (activityData?.pages.flat() as ActivityResponse[]) || [];

  if (isLoadingGroup || isLoadingActivity) return <GroupViewSkeleton />;
  if (!group) return <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center text-red-500 font-medium">Failed to load tab</div>;

  const expenses = activities?.filter(a => a.type === 'expense') || [];
  const settlements = activities?.filter(a => a.type === 'settlement') || [];

  const handleDeleteActivity = async (item: ActivityResponse) => {
    setOpenMenuId(null);
    if (await showConfirm('Delete Activity', 'Are you sure you want to delete this?', { danger: true })) {
      deleteMutation.mutate(item);
    }
  };

  const renderActivityItem = (item: ActivityResponse) => (
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
                                  onClick={() => handleDeleteActivity(item)}
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
      
      <GroupHeader group={group} id={id as string} setIsShareOpen={setIsShareOpen} />

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
               
               <div className="flex bg-bg-soft rounded-full p-1 gap-1 w-full sm:w-auto  border border-line-dark shadow-sm">
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
              
              {hasNextPage && (
                <div className="flex justify-center pt-4 pb-2">
                  <button 
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="btn-secondary text-[14px] px-4 py-2"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load older activity'}
                  </button>
                </div>
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
