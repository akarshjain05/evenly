import { getAuthStatus } from './utils/auth';
import DialogModal from "./components/modals/DialogModal";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GroupView from './pages/GroupView'
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from './pages/NotFoundPage'
import JoinGroupPage from './pages/JoinGroupPage'


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
import { useUIStore } from './store/uiStore';

function App() {
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
      <DialogModal />
    </>
  )
}

export default App
