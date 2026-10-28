import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Cine<span className="text-brand-500">Pass</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-white">Sign In to Your Account</h2>
          <p className="text-xs text-slate-400">Access exclusive showtimes, discounts, and booking history</p>
        </div>

        {/* Demo Credentials Quick Buttons */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Demo Credentials (1-Click Fill)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('admin@cinepass.com', 'AdminPassword@123')}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Admin Account</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('ashish@example.com', 'UserPassword@123')}
              className="p-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
            >
              <User className="w-4 h-4 text-brand-400" />
              <span>User Account</span>
            </button>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-800 space-y-4 shadow-2xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-rose-500 hover:from-brand-500 hover:to-rose-400 text-xs font-bold text-white shadow-glow transition disabled:opacity-50 flex items-center justify-center space-x-1.5 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-xs text-center text-slate-400 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
              Register here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};
export default LoginPage;
