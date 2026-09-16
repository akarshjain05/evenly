
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-[#08060d]">
      <aside className="w-64 bg-white border-r border-[#e5e4e7] flex flex-col">
        <div className="flex-1 overflow-hidden">
          <Sidebar />
        </div>
        <div className="p-4 border-t border-[#e5e4e7]">
          <button onClick={logout} className="w-full py-2 text-sm font-medium text-center border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 transition-colors">
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 relative">
        <Outlet />
      </main>
    </div>
  );
}
