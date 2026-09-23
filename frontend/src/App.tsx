import { getAuthStatus, setAuthStatus } from './utils/auth';
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
  componentDidCatch() {
    // If the error boundary fires while the user is supposedly logged in,
    // it's almost certainly because their session expired and the local DB
    // is empty/corrupt.  Clear the stale auth flag so ProtectedRoute will
    // redirect to /login on the next render.
    setAuthStatus(false);
  }
  render() {
    if (this.state.hasError) {
      // After clearing auth, redirect to login
      return <Navigate to="/login" replace />;
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
  const location = useLocation();
  useEffect(() => {
    if (getAuthStatus()) {
      syncEngine.start();
    } else {
      syncEngine.stop();
    }
    // DO NOT return syncEngine.stop() on unmount because App doesn't unmount on route change
  }, [location.pathname]);

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
