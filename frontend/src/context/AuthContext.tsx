import { createContext, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { UserLogin, UserCreate } from '../types/api';
import { apiClient } from '../api/client';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(localStorage.getItem('is_logged_in') === 'true');

  const login = async (data: UserLogin) => {
    await apiClient.post('auth/login', data);
    localStorage.setItem('is_logged_in', 'true');
    setIsAuthenticated(true);
  };

  const register = async (data: UserCreate) => {
    await apiClient.post('auth/register', data);
    localStorage.setItem('is_logged_in', 'true');
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try { await apiClient.post('auth/logout'); } catch (e) {}
    localStorage.removeItem('is_logged_in');
    setIsAuthenticated(false);
    queryClient.clear();
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
