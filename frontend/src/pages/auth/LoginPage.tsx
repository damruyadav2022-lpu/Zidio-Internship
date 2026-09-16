import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('evaluator@retailpulse.ai');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/overview', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/app/overview');
    } else {
      setError(result.error || 'Invalid credentials. Please verify or use 1-Click Demo.');
    }
  };

  const handleDemoAccess = async () => {
    setError(null);
    setIsSubmitting(true);
    const result = await demoLogin();
    setIsSubmitting(false);

    if (result.success) {
      navigate('/app/overview');
    } else {
      setError('Unable to activate demo login. Please try typing credentials manually.');
    }
  };

  const fillCredentials = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-dark-bg">
      <div className="w-full max-w-md bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-8 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-9 h-9 rounded-xl bg-pulse-orange text-white flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-heading">
              Retail<span className="text-brand-600">Pulse</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mt-1">Access AI demand forecasting & customer analytics</p>
        </div>

        {/* 1-Click Demo Access Banner */}
        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
            <Sparkles className="w-4 h-4 text-pulse-orange shrink-0" />
            <span>Evaluating the project? Instant access available.</span>
          </div>
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-[11px] shadow-xs shrink-0 transition-colors cursor-pointer"
          >
            1-Click Demo
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Authentication Failed</p>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-dark-border rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] text-brand-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-dark-border rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Test Accounts Helper */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-dark-border text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <Shield className="w-3.5 h-3.5 text-brand-600" />
            <span>Pre-Configured Credentials:</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Evaluator: <code>evaluator@retailpulse.ai</code> / <code>password123</code></span>
            <button
              type="button"
              onClick={() => fillCredentials('evaluator@retailpulse.ai', 'password123')}
              className="text-brand-600 hover:underline text-[10px] font-semibold"
            >
              Use
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span>Admin: <code>admin@retailpulse.ai</code> / <code>admin123</code></span>
            <button
              type="button"
              onClick={() => fillCredentials('admin@retailpulse.ai', 'admin123')}
              className="text-brand-600 hover:underline text-[10px] font-semibold"
            >
              Use
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-dark-border">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:underline">
            Start 14-day free trial
          </Link>
        </div>

      </div>
    </div>
  );
};
