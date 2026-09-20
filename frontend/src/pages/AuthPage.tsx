import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../components/ui/Logo';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await register({ email, name, password });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      const detail = err.response?.data?.userMessage || err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail[0]?.msg : 'An error occurred'));
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center min-h-screen px-5 py-6 gap-[22px] max-w-md mx-auto">
      
      <div className="text-center text-brass">
        <Logo className="w-10 h-10 mx-auto" />
      </div>
      
      <div>
        <h1 className="font-display text-[30px] font-semibold text-ink flex items-center justify-center gap-2.5 m-0 leading-tight">
          Evenly
        </h1>
        <p className="text-center text-on-dark-soft text-[15px] mt-1.5 leading-snug">
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
              setName('');
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
              setName('');
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
        
        {!isLogin && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft" htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Alice"
              required={!isLogin}
            />
          </div>
        )}
        
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
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-10"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {!isLogin && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-ink-soft" htmlFor="confirm-password">Confirm Password</label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary mt-2">
          {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      {isLoading && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-line-dark border-t-primary animate-spin"></div>
            <div className="text-ink font-medium text-[15px]">Logging you in...</div>
          </div>
        </div>
      )}
    </div>
  );
}
