import { SidebarSkeleton } from "./Skeleton";
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { MembershipResponse } from '../types/api';
import { PlusCircle } from 'lucide-react';

const fetchGroups = async (): Promise<MembershipResponse[]> => {
  const { data } = await apiClient.get('users/me/groups');
  return data;
};

export default function Sidebar() {
  const { data: groups, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="p-[24px] pb-[16px] hidden md:flex items-center justify-between">
        <Link to="/" className="no-underline">
          <h2 className="font-display text-[24px] font-semibold text-ink m-0 hover:opacity-80 transition-opacity cursor-pointer">
            Evenly
          </h2>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto px-[12px] flex flex-col gap-1">
        <div className="text-[11px] font-semibold text-on-dark-soft uppercase tracking-[0.5px] px-[12px] pt-[8px] pb-[4px]">Your Tabs</div>
        

        {isLoading && <SidebarSkeleton />}
        {error && <div className="text-sm text-[#c81e1e] px-[12px]">Failed to load tabs</div>}
        
        <ul className="space-y-1">
          {groups?.map((m) => (
            <li key={m.group.id}>
              <Link
                to={`/group/${m.group.id}`}
                className={`block px-[12px] py-[10px] rounded-[10px] transition-colors text-[15px] font-medium ${
                  location.pathname === `/group/${m.group.id}`
                    ? 'bg-bg-soft text-ink border border-line-dark shadow-sm'
                    : 'text-ink border border-transparent hover:bg-paper-dim'
                }`}
              >
                {m.group.name}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/new"
          className="mt-2 flex items-center gap-3 px-[12px] py-[10px] text-[15px] font-medium text-brass hover:bg-highlight rounded-[10px] transition-colors border border-transparent"
        >
          <PlusCircle size={18} /> New Tab
        </Link>
      </div>
    </div>
  );
}
