import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 glass-strong border-b border-white/[0.06]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <button onClick={() => navigate(user?.role === 'teacher' ? '/teacher' : '/student')} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
            <QrIcon />
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-gradient">DRAIT</span>
            <span className="text-sm font-medium text-text-secondary ml-1">Attendance</span>
          </div>
        </button>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-text-primary leading-tight">{user.name}</p>
              <p className="text-xs text-text-muted leading-tight">{user.email}</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${user.role === 'teacher' ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400' : 'bg-accent/20 border border-accent/40 text-accent'}`}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-text-muted hover:text-danger transition-colors p-2 rounded-lg hover:bg-danger/10"
              title="Logout"
            >
              <LogoutIcon />
            </button>
          </div>
        )}
      </div>
    </motion.nav>
  );
}

function QrIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h3M14 18h3M21 18v3M18 21h3" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
    </svg>
  );
}
