import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';
import { saveSession } from '../services/auth';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (login) => {
    setIsLogin(login);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const data = await loginUser(username, password);
        if (data.status === 'success') {
          saveSession(data.token, data.user);
          navigate(data.user.role === 'admin' ? '/admin' : '/');
        } else {
          setError(data.message || 'Login failed');
        }
      } else {
        const data = await registerUser(username, password);
        if (data.status === 'success') {
          // Auto-login after register
          saveSession(data.token, data.user);
          setSuccess('Account created! Redirecting...');
          setTimeout(() => navigate('/'), 800);
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-slate-950" />

      <div className="relative w-full max-w-md">
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              <Eye size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">CivicEye</h1>
            <p className="text-slate-400 mt-2">AI-powered road monitoring system</p>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                isLogin ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => switchMode(true)}
            >
              Login
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                !isLogin ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              onClick={() => switchMode(false)}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder={isLogin ? 'Enter password' : 'Min. 6 characters'}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2.5 bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-sm">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 font-medium transition"
              onClick={() => switchMode(!isLogin)}
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <p className="text-center text-slate-600 text-xs mt-4">
            Demo admin: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
