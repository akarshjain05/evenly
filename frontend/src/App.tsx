import { getAuthStatus } from './utils/auth';
import DialogModal from "./components/modals/DialogModal";
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'

import { Suspense, lazy, useEffect, Component } from 'react';
import { syncEngine } from './db/syncEngine';
import { useUIStore } from './store/uiStore';

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

import { Outlet } from 'react-router-dom';

class RouteErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <p className="text-ink-soft text-lg mb-4">Something went wrong loading this page.</p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


function ErrorBoundaryLayout() {
  return (
    <RouteErrorBoundary>
      <Outlet />
    </RouteErrorBoundary>
  );
}

function App() {
  const setInstallPromptEvent = useUIStore((state) => state.setInstallPromptEvent);
  const initTheme = useUIStore((state) => state.initTheme);

  useEffect(() => { initTheme(); }, [initTheme]);

  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthLogout = () => navigate('/login');
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, [navigate]);

  // Start the sync engine when authenticated, stop on logout
  useEffect(() => {
    if (getAuthStatus()) {
      syncEngine.start();
    }
    return () => syncEngine.stop();
  }, []);

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
      <Route element={<ProtectedRoute><ErrorBoundaryLayout /></ProtectedRoute>}>
        <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/group/:id" element={<GroupView />} />
        <Route path="/join/:code" element={<JoinGroupPage />} />

      </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
      </Suspense>
      <DialogModal />
    </>
  )
}

export default App
