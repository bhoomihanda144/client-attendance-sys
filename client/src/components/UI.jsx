import { motion } from 'framer-motion';

export function GlassCard({ children, className = '', hover = false, glow = null, ...props }) {
  return (
    <motion.div
      className={`glass rounded-2xl shadow-card ${hover ? 'hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200' : ''} ${glow === 'green' ? 'glow-green' : glow === 'red' ? 'glow-red' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({ icon, label, value, sub, color = 'green' }) {
  const colors = {
    green: 'text-accent',
    red: 'text-danger',
    yellow: 'text-warn',
    blue: 'text-blue-400',
  };
  return (
    <GlassCard className="p-5" hover>
      <div className="flex items-start gap-3">
        <div className={`text-2xl ${colors[color]}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-text-secondary text-sm font-medium">{label}</p>
          <p className={`text-2xl font-bold mt-0.5 ${colors[color]}`}>{value}</p>
          {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
        </div>
      </div>
    </GlassCard>
  );
}

export function Badge({ children, variant = 'green' }) {
  const map = { green: 'badge-green', red: 'badge-red', yellow: 'badge-yellow' };
  return <span className={map[variant]}>{children}</span>;
}

export function Spinner({ size = 'md', color = 'accent' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  const colors = { accent: 'border-accent', white: 'border-white', red: 'border-danger' };
  return (
    <div className={`${sizes[size]} border-2 ${colors[color]} border-t-transparent rounded-full animate-spin`} />
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <div className="text-5xl opacity-30">{icon}</div>
      <p className="text-text-secondary font-medium">{title}</p>
      {description && <p className="text-text-muted text-sm max-w-xs">{description}</p>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-primary grid-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function AlertBanner({ type = 'error', message, onClose }) {
  const styles = {
    error: 'bg-danger/15 border-danger/30 text-danger-light',
    success: 'bg-accent/15 border-accent/30 text-accent-light',
    warning: 'bg-warn/15 border-warn/30 text-warn-light',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-sm font-medium ${styles[type]}`}
    >
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">✕</button>
      )}
    </motion.div>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {subtitle && <p className="text-text-secondary text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, size = 'md' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className={`${sizes[size]} rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center font-bold text-accent-light flex-shrink-0`}>
      {initials}
    </div>
  );
}
