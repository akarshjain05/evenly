import type { GroupDetailResponse } from '../../types/api';
import { useState } from 'react';
import { Sun, Moon, Share2, MoreVertical } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';

export const GroupHeader = ({ group, id, setIsShareOpen }: { group: GroupDetailResponse, id: string, setIsShareOpen: (v: boolean) => void }) => {
  const [showMenu, setShowMenu] = useState(false);
  const { showPrompt, showAlert, showConfirm, isDarkMode, toggleDarkMode } = useUIStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useCurrentUser();
  const currentMember = group?.members?.find((m: any) => m.user_id === user?.id);
  const isAdmin = currentMember?.is_admin;

  return (
    <div className="flex justify-between items-start mb-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-ink">{group.name}</h1>
        </div>
        <p className="text-sm text-on-dark-soft">Invite Code: <span className="font-mono font-medium text-ink">{group.invite_code}</span></p>
      </div>
      <div className="flex gap-2 items-center relative">
        <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer" title="Toggle Theme">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={() => setIsShareOpen(true)} className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer" title="Share Tab">
          <Share2 size={20} />
        </button>
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-full hover:bg-bg text-ink-soft transition-colors border-none bg-transparent cursor-pointer">
          <MoreVertical size={20} />
        </button>
        
        {showMenu && (
          <div className="absolute top-12 right-0 w-48 bg-paper border border-line-dark rounded-xl shadow-xl z-10 py-1">
            {isAdmin && (
            <button onClick={async () => {
              setShowMenu(false);
              const newName = await showPrompt("Rename Tab", group.name);
              if (newName && newName !== group.name) {
                const oldGroup = queryClient.getQueryData(['group', id]);
                const oldGroups = queryClient.getQueryData(['groups']);
                
                // Optimistic UI Update
                queryClient.setQueryData(['group', id], (old: any) => old ? { ...old, name: newName } : old);
                queryClient.setQueryData(['groups'], (old: any) => old ? old.map((g: any) => g.id === id ? { ...g, name: newName } : g) : old);
                
                try {
                  await apiClient.put(`groups/${id}`, { name: newName });
                  queryClient.invalidateQueries({ queryKey: ['group', id] });
                  queryClient.invalidateQueries({ queryKey: ['groups'] });
                } catch (e: any) {
                  // Revert on failure
                  queryClient.setQueryData(['group', id], oldGroup);
                  queryClient.setQueryData(['groups'], oldGroups);
                  showAlert('Error', e.response?.data?.detail || 'Failed to rename tab.');
                }
              }
            }} className="w-full text-left px-4 py-2 text-[14px] text-ink hover:bg-bg transition-colors">
              Rename Tab
            </button>
            )}
            <button onClick={async () => {
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
            }} className="w-full text-left px-4 py-2 text-[14px] text-ink hover:bg-bg transition-colors">
              Export to CSV
            </button>
            {isAdmin && (
            <button onClick={async () => {
              setShowMenu(false);
              const confirmed = await showConfirm("Delete Tab", "Are you sure you want to delete this tab? This will permanently delete all expenses and settlements. This action cannot be undone.");
              if (confirmed) {
                try {
                  await apiClient.delete(`groups/${id}`);
                  queryClient.setQueryData(['groups'], (old: any) => old?.filter((m: any) => m.group.id !== id));
                  queryClient.invalidateQueries({ queryKey: ['groups'] });
                  navigate('/', { replace: true });
                } catch (e: any) {
                  showAlert('Error', e.response?.data?.detail || 'Failed to delete tab.');
                }
              }
            }} className="w-full text-left px-4 py-2 text-[14px] text-[#c81e1e] hover:bg-bg transition-colors">
              Delete Tab
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
