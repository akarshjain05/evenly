
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export default function Layout() {
  const { isAuthenticated, logout } = useAuth();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get('users/me');
      return data;
    },
    enabled: isAuthenticated
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Derive initials and name from email if no name is available globally
  const emailName = user?.email ? user.email.split('@')[0] : 'User';
  const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-bg text-ink">
      <aside className="w-64 bg-bg border-r border-line-dark flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Sidebar />
        </div>
        <div className="p-4">
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to sign out?')) {
                logout();
              }
            }} 
            className="w-full flex items-center gap-3 p-3 bg-paper border border-line-dark rounded-[16px] shadow-sm hover:border-brass transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium text-[15px] shrink-0">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold text-ink text-[15px] truncate">{displayName}</div>
              <div className="text-[13px] text-on-dark-soft truncate">Personal settings</div>
            </div>
            <Settings size={20} className="text-on-dark-soft group-hover:text-ink transition-colors shrink-0" />
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 relative">
        <Outlet />
      </main>
    </div>
  );
}
