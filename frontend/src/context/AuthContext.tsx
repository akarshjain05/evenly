import { createContext, useContext, useState, useEffect } from 'react';
import type { UserLogin, UserCreate, Token } from '../types/api';
import { apiClient } from '../api/client';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (data: UserLogin) => Promise<void>;
  register: (data: UserCreate) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const login = async (data: UserLogin) => {
    // Note: FastAPI uses OAuth2PasswordRequestForm, but this app might use JSON
    // Let's check schemas. UserLogin is a standard JSON payload. Wait, no.
    // In main.py: `@app.post("/api/auth/login") def login(payload: schemas.UserLogin...)`
    // Yes, it expects a JSON payload according to schemas.UserLogin.
    const response = await apiClient.post<Token>('auth/login', data);
    localStorage.setItem('token', response.data.access_token);
    setToken(response.data.access_token);
  };

  const register = async (data: UserCreate) => {
    const response = await apiClient.post<Token>('auth/register', data);
    localStorage.setItem('token', response.data.access_token);
    setToken(response.data.access_token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, register, logout }}>
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
