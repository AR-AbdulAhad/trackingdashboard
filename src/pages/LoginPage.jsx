import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../lib/api';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login: doLogin, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      doLogin(data.token, data.admin);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-100/50 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-30 mix-blend-multiply filter blur-3xl bg-sky-200 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full opacity-30 mix-blend-multiply filter blur-3xl bg-indigo-200 animate-blob animation-delay-2000" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="StudentLife Logo" className="h-24 mx-auto mb-4 drop-shadow-md" />
          <h1 className="text-2xl font-bold text-slate-800 brand-text">Analytics Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to access visitor intel</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl mb-6 bg-red-50 border border-red-100">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-600 text-sm font-bold mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@studentlife.dk"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 font-medium text-sm outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 text-sm font-bold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-800 placeholder-slate-400 font-medium text-sm outline-none focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : 'Access Dashboard'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs font-medium mt-8">
          StudentLife Customer Intelligence Platform &copy; 2025
        </p>
      </div>
    </div>
  );
}
