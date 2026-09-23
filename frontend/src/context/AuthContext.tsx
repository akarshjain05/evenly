import { getAuthStatus, setAuthStatus } from '../utils/auth';
import { createContext, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '../db/db';
import type { UserLogin, UserCreate } from '../types/api';
import { apiClient } from '../api/client';
import { useUIStore } from '../store/uiStore';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getAuthStatus());

  const login = async (data: UserLogin) => {
    await apiClient.post('auth/login', data);
    setAuthStatus(true);
    setIsAuthenticated(true);
  };

  const register = async (data: UserCreate) => {
    await apiClient.post('auth/register', data);
    setAuthStatus(true);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await apiClient.post('auth/logout');
      // Only clear client state if the server successfully revokes the HttpOnly session cookie
      setAuthStatus(false);
      setIsAuthenticated(false);
      queryClient.clear();
      
      // Wipe the offline database for security and to prevent data mixing between accounts
      try { await db.delete(); await db.open(); } catch (e) { console.error("Failed to clear local db", e); }
    } catch (e) {
      console.warn('Logout failed to cleanly clear server session:', e);
      useUIStore.getState().showAlert('Logout Error', 'Failed to securely clear session from the server. For your security, you are still logged in.');
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
