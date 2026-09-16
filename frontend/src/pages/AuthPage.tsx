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
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center min-h-screen px-5 py-6 gap-[22px] max-w-md mx-auto">
      
      <div className="text-center text-brass">
        <svg viewBox="0 0 40 40" className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="10" y1="8" x2="10" y2="32"/><line x1="16" y1="8" x2="16" y2="32"/>
          <line x1="22" y1="8" x2="22" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/>
          <line x1="7" y1="30" x2="31" y2="10"/>
        </svg>
      </div>
      
      <div>
        <h1 className="font-display text-[30px] font-medium text-center m-0 leading-tight">Evenly</h1>
        <p className="text-center text-on-dark-soft text-[15px] mt-1 leading-snug">
          {isLogin ? 'Sign in to your account' : 'Create a free account'}
        </p>
      </div>

      <div className="flex bg-bg-soft rounded-full p-1 gap-1 mx-auto w-full max-w-[240px] border border-line-dark shadow-sm">
        <button 
          type="button"
          onClick={() => {
            if (!isLogin) {
              setIsLogin(true);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setError('');
            }
          }}
          className={`flex-1 py-2.5 rounded-full text-[14px] font-medium transition-colors ${isLogin ? 'bg-primary text-white' : 'text-on-dark-soft bg-transparent'}`}
        >
          Sign In
        </button>
        <button 
          type="button"
          onClick={() => {
            if (isLogin) {
              setIsLogin(false);
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setError('');
            }
          }}
          className={`flex-1 py-2.5 rounded-full text-[14px] font-medium transition-colors ${!isLogin ? 'bg-primary text-white' : 'text-on-dark-soft bg-transparent'}`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-paper text-ink rounded-[14px] p-[22px] flex flex-col gap-[14px] border border-line-dark shadow-sm">
        {error && <div className="text-[#c81e1e] text-[13px] text-center font-medium">{error}</div>}
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-ink-soft" htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] text-ink-soft" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {!isLogin && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft" htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        )}

        <button type="submit" className="btn-primary mt-2">
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

    </div>
  );
}
