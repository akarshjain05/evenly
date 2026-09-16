import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { MembershipResponse } from '../types/api';
import { PlusCircle, Users } from 'lucide-react';

const fetchGroups = async (): Promise<MembershipResponse[]> => {
  const { data } = await apiClient.get('/users/me/groups');
  return data;
};

export default function Sidebar() {
  const { data: groups, isLoading, error } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  });
  const location = useLocation();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#e5e4e7] flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#08060d] flex items-center gap-2">
          <Users size={20} className="text-[#C19A5B]" /> Evenly
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Your Tabs</div>
        
        {isLoading && <div className="text-sm text-gray-400">Loading...</div>}
        {error && <div className="text-sm text-red-500">Failed to load tabs</div>}
        
        <ul className="space-y-1">
          {groups?.map((m) => (
            <li key={m.group.id}>
              <Link
                to={`/group/${m.group.id}`}
                className={`block px-3 py-2 rounded-md transition-colors ${
                  location.pathname === `/group/${m.group.id}`
                    ? 'bg-[#C19A5B] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {m.group.name}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/new"
          className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-[#C19A5B] hover:bg-orange-50 rounded-md transition-colors"
        >
          <PlusCircle size={16} /> New Tab
        </Link>
      </div>
    </div>
  );
}
