import { getAuthStatus } from './utils/auth';
import DialogModal from "./components/modals/DialogModal";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'

import { Suspense, lazy } from 'react';
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GroupView = lazy(() => import('./pages/GroupView'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const JoinGroupPage = lazy(() => import('./pages/JoinGroupPage'));


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = getAuthStatus();
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = getAuthStatus();
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

import { useEffect } from 'react';
import { syncOfflineQueue } from './utils/offlineQueue';
import { useQueryClient, useIsRestoring } from '@tanstack/react-query';
import { useUIStore } from './store/uiStore';

function App() {

  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  
  useEffect(() => {
    const handleOnline = () => syncOfflineQueue(queryClient);
    window.addEventListener('online', handleOnline);
    if (navigator.onLine) {
      handleOnline();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [queryClient]);

  if (isRestoring) {
    return null; // Avoid rendering anything (and throwing errors) until IndexedDB cache is hydrated
  }
  const setInstallPromptEvent = useUIStore((state) => state.setInstallPromptEvent);
  const initTheme = useUIStore((state) => state.initTheme);
  useEffect(() => { initTheme(); }, [initTheme]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setInstallPromptEvent]);

  return (
    <>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg text-ink-soft">Loading...</div>}>
      <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/group/:id" element={<GroupView />} />
        <Route path="/join/:code" element={<JoinGroupPage />} />

      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
      </Suspense>
      <DialogModal />
    </>
  )
}

export default App
