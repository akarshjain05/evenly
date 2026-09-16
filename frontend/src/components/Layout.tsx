import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-[#08060d]">
      <aside className="w-64 bg-white border-r border-[#e5e4e7] flex flex-col">
        <div className="p-4 border-b border-[#e5e4e7] flex items-center justify-between">
          <h2 className="text-xl font-semibold">Evenly</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {/* Group Links will go here */}
          <div className="text-sm text-gray-500 mb-2">Your Tabs</div>
          {/* <GroupList /> */}
        </nav>
        <div className="p-4 border-t border-[#e5e4e7]">
          <button onClick={logout} className="w-full py-2 text-sm text-center border rounded-md hover:bg-gray-50">
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
