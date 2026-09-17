import DialogModal from "./components/modals/DialogModal";
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import GroupView from './pages/GroupView'
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
  const location = useLocation();
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = localStorage.getItem('is_logged_in') === 'true';
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <>
      <Routes>
      <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/group/:id" element={<GroupView />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
      <DialogModal />
    </>
  )
}

export default App
