import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
      navigate('/'); // Redirect to dashboard
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-[#FAF9F6] text-[#08060d]">
      <div className="mb-8 text-[#C19A5B]">
        <svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="10" y1="8" x2="10" y2="32"/><line x1="16" y1="8" x2="16" y2="32"/>
          <line x1="22" y1="8" x2="22" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/>
          <line x1="7" y1="30" x2="31" y2="10"/>
        </svg>
      </div>
      <h1 className="text-4xl font-semibold mb-2">Evenly</h1>
      <p className="text-[#6b6375] mb-8">{isLogin ? 'Sign in to your account' : 'Create an account'}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md border border-[#e5e4e7]">
        {error && <div className="mb-4 text-red-500 text-center text-sm">{error}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#C19A5B]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#C19A5B]"
            required
            minLength={6}
          />
        </div>

        {!isLogin && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#C19A5B]"
              required
              minLength={6}
            />
          </div>
        )}

        <button type="submit" className="w-full py-2 bg-[#08060d] text-white rounded-md hover:bg-[#1a1625] transition-colors">
          {isLogin ? 'Sign In' : 'Register'}
        </button>
      </form>

      <button onClick={() => setIsLogin(!isLogin)} className="mt-6 text-sm text-[#6b6375] hover:underline">
        {isLogin ? 'Need an account? Register' : 'Already have an account? Sign in'}
      </button>
    </div>
  );
}
