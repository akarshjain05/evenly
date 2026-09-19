import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Settings, Menu, X, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import Logo from './ui/Logo';
import { useUIStore } from '../store/uiStore';

export default function Layout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const installPromptEvent = useUIStore(state => state.installPromptEvent);
  const setInstallPromptEvent = useUIStore(state => state.setInstallPromptEvent);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get('users/me');
      return data;
    },
    enabled: isAuthenticated
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Use explicitly provided name, or derive from email
  const displayName = user?.name ? user.name : (user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : 'User');
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-bg text-ink overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-bg border-r border-line-dark flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-4 md:hidden border-b border-line-dark">
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5 text-brass" />
            <div className="font-display font-bold text-xl text-ink">Evenly</div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-ink-soft p-1 cursor-pointer">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
        <div className="p-4 shrink-0 border-t border-line-dark md:border-t-0 space-y-3">

          <button 
            onClick={() => navigate('/settings')} 
            className="w-full flex items-center gap-3 p-3 bg-paper border border-line-dark rounded-[16px] shadow-sm hover:border-brass transition-colors cursor-pointer text-left group"
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {installPromptEvent && (
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-sm animate-fade-in z-40">
            <div className="flex items-center gap-2 font-medium text-[15px]">
              <Download size={18} />
              Install Evenly for a better experience
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  installPromptEvent.prompt();
                  const { outcome } = await installPromptEvent.userChoice;
                  if (outcome === 'accepted') {
                    setInstallPromptEvent(null);
                  }
                }}
                className="bg-white text-primary px-3 py-1.5 rounded-lg font-semibold text-[14px] hover:bg-opacity-90 transition-opacity cursor-pointer border-none"
              >
                Install
              </button>
              <button 
                onClick={() => setInstallPromptEvent(null)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer border-none"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
        {/* Mobile Header */}
        <header className="md:hidden flex items-center gap-3 p-4 border-b border-line-dark bg-bg shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-ink p-1 cursor-pointer -ml-1">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Logo className="w-5 h-5 text-brass" />
            <div className="font-display font-bold text-xl text-ink">Evenly</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
