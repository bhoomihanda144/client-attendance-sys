import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email.trim());
      login(data.user);
      navigate(data.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) {
      setError(err.error || 'Login failed. Check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    setEmail(type === 'teacher' ? 'teacher@drait.edu.in' : '1da23cs031@drait.edu.in');
    setError('');
  };

  return (
    <div className="min-h-screen bg-bg-primary grid-bg flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center glow-green"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h2v2h-2zM18 14h3M14 18h3M21 18v3M18 21h3" strokeLinecap="round" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold text-gradient mb-1"
          >
            QR Attendance
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary text-sm"
          >
            DRAIT Smart Attendance System
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-strong rounded-3xl p-8 shadow-card"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-1">Sign In</h2>
          <p className="text-text-muted text-sm mb-6">Enter your institute email to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="yourname@drait.edu.in"
                className="input font-mono text-sm"
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-danger/10 border border-danger/30 text-danger-light text-sm rounded-xl px-4 py-3"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In →'}
            </button>
          </form>

          {/* Quick fill */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-text-muted mb-3 text-center">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fillDemo('teacher')}
                className="text-xs px-3 py-2.5 rounded-xl border border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors font-medium"
              >
                👨‍🏫 Teacher Demo
              </button>
              <button
                onClick={() => fillDemo('student')}
                className="text-xs px-3 py-2.5 rounded-xl border border-accent/30 text-accent bg-accent/10 hover:bg-accent/20 transition-colors font-medium"
              >
                👨‍🎓 Student Demo
              </button>
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-text-muted mt-6"
        >
          Teacher: <span className="font-mono text-text-secondary">teacher@drait.edu.in</span><br />
          Students: <span className="font-mono text-text-secondary">rollno@drait.edu.in</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
