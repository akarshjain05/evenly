import { formatCurrency } from '../utils/currency';
import React, { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useParams } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { ActivityResponse } from '../types/api';
import { useUIStore } from '../store/uiStore';
import { Plus, Handshake, Trash2, Pencil, MoreVertical } from 'lucide-react';
import AddExpenseModal from '../components/modals/AddExpenseModal';
import EditExpenseModal from '../components/modals/EditExpenseModal';
import EditSettlementModal from '../components/modals/EditSettlementModal';
import SettleUpModal from '../components/modals/SettleUpModal';
import ShareModal from '../components/modals/ShareModal';
import { GroupHeader } from '../components/group/GroupHeader';
import { BalancesSidebar } from '../components/group/BalancesSidebar';
import { SettleSuggestions } from '../components/group/SettleSuggestions';
import { useLocalGroup, useLocalActivity } from '../db/hooks';
import { deleteExpense, deleteSettlement } from '../db/mutations';


interface ActivityItemProps {
  item: ActivityResponse;
  isOpen: boolean;
  isDeleting: boolean;
  onToggle: (id: string | null) => void;
  onEdit: (item: ActivityResponse) => void;
  onDelete: (item: ActivityResponse) => void;
  getDisplayName: (memberId: string | null | undefined, fallbackName: string | null | undefined) => string;
}

const ActivityItem = React.memo(({ 
  item, 
  isOpen, 
  isDeleting,
  onToggle, 
  onEdit, 
  onDelete,
  getDisplayName 
}: ActivityItemProps) => {
  return (
    <div className={`p-4 sm:p-6 flex items-start gap-4 transition-colors relative last:rounded-b-2xl ${isDeleting ? 'opacity-50 pointer-events-none' : 'hover:bg-bg'}`}>
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-paper shadow-sm rounded-full px-4 py-2 text-sm font-medium text-ink-soft flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            Deleting...
          </div>
        </div>
      )}
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
                onClick={() => onToggle(item.id)}
                className="p-1 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
              >
                <MoreVertical size={16} />
              </button>
              {isOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => onToggle(null)} />
                  <div className="absolute right-0 top-7 w-36 bg-paper border border-line-dark rounded-xl shadow-xl z-20 py-1">
                    <button
                      onClick={() => onEdit(item)}
                      className="w-full text-left px-4 py-2 text-[13px] text-ink hover:bg-bg transition-colors flex items-center gap-2"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => onDelete(item)}
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
});

export default function GroupView() {
  const { id } = useParams<{ id: string }>();
  
  const { openAddExpense, openSettleUp, showAlert, showConfirm } = useUIStore();
  
  const [editingExpense, setEditingExpense] = useState<ActivityResponse | null>(null);
  const [editingSettlement, setEditingSettlement] = useState<ActivityResponse | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<'expenses' | 'settlements'>('expenses');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: user } = useCurrentUser();
  
  // Local-first: reads from Dexie (instant, reactive, offline)
  const group = useLocalGroup(id);
  const activities = useLocalActivity(id);

  const getDisplayName = useCallback((memberId: string | null | undefined, fallbackName: string | null | undefined) => {
    if (!memberId) return fallbackName || 'Unknown';
    const member = group?.members.find(m => m.id === memberId);
    if (member && user && member.user_id === user.id) {
      return 'You';
    }
    return fallbackName || member?.name || 'Unknown';
  }, [group?.members, user]);

  const handleToggleMenu = React.useCallback((id: string | null) => {
    setOpenMenuId(prev => prev === id ? null : id);
  }, []);

  const handleEditItem = React.useCallback((item: ActivityResponse) => {
    setOpenMenuId(null);
    if (item.type === 'settlement') {
      setEditingSettlement(item);
    } else {
      setEditingExpense(item);
    }
  }, []);

  const handleDeleteItem = React.useCallback(async (item: ActivityResponse) => {
    setOpenMenuId(null);
    if (await showConfirm('Delete Activity', 'Are you sure you want to delete this?', { danger: true })) {
      setDeletingId(item.id);
      try {
        if (item.type === 'settlement') {
          await deleteSettlement(id!, item.id);
        } else {
          await deleteExpense(id!, item.id);
        }
      } catch (err: any) {
        showAlert('Error', err?.message || 'Failed to delete activity.');
      } finally {
        setDeletingId(null);
      }
    }
  }, [id, showConfirm, showAlert]);

const expenses = useMemo(() => activities?.filter(a => a.type === 'expense') || [], [activities]);
  const settlements = useMemo(() => activities?.filter(a => a.type === 'settlement') || [], [activities]);

  const activeItems = activeActivityTab === 'expenses' ? expenses : settlements;

  const parentRef = useRef<HTMLDivElement>(null);
  const [parentOffset, setParentOffset] = useState(0);

  useLayoutEffect(() => {
    if (parentRef.current) {
      setParentOffset(parentRef.current.offsetTop);
    }
  }, []);
  
  const rowVirtualizer = useWindowVirtualizer({
    count: activeItems.length,
    estimateSize: () => 75,
    overscan: 5,
    scrollMargin: parentOffset,
  });

  if (!group) return <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center text-ink-soft font-medium">Loading tab...</div>;




  const renderActivityItem = (item: ActivityResponse) => (
    <ActivityItem 
      key={item.id} 
      item={item} 
      isOpen={openMenuId === item.id} 
      isDeleting={deletingId === item.id}
      onToggle={handleToggleMenu} 
      onEdit={handleEditItem} 
      onDelete={handleDeleteItem} 
      getDisplayName={getDisplayName} 
    />
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
{activeItems.length === 0 ? (
                <p className="text-ink-soft italic text-center py-8 text-[15px]">No {activeActivityTab === 'expenses' ? 'payments' : 'settlements'} yet.</p>
              ) : (
                <div ref={parentRef}>
                  <div
                    style={{
                      height: `${rowVirtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                      const item = activeItems[virtualRow.index];
                      if (!item) return null;
                      return (
                        <div
                          key={virtualRow.key}
                          data-index={virtualRow.index}
                          ref={rowVirtualizer.measureElement}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualRow.start - parentOffset}px)`,
                          }}
                        >
                          {renderActivityItem(item)}
                        </div>
                      );
                    })}
                  </div>
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
