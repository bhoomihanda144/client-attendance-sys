import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { GlassCard, StatCard, Badge, Spinner, EmptyState, SectionHeader } from '../components/UI';
import Navbar from '../components/Navbar';

function CircularProgress({ percentage }) {
  const size = 140;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color = percentage >= 85 ? '#10b981' : percentage >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold"
          style={{ color }}
        >
          {percentage}%
        </motion.p>
        <p className="text-xs text-text-muted">attendance</p>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getStudentAttendance(user._id);
        setData(res);
      } catch (err) {
        setError(err.error || 'Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user._id]);

  const stats = data?.stats;
  const history = data?.history || [];

  return (
    <div className="min-h-screen bg-bg-primary grid-bg">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">My Attendance</h1>
              <p className="text-text-secondary text-sm mt-1">Track your class attendance and stay on top of your record</p>
            </div>
            <button onClick={() => navigate('/scan')} className="btn-primary text-sm flex items-center gap-2">
              📷 Scan QR
            </button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : error ? (
          <GlassCard className="p-8 text-center">
            <p className="text-danger-light">{error}</p>
          </GlassCard>
        ) : (
          <>
            {/* Low attendance warning */}
            <AnimatePresence>
              {stats?.belowThreshold && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 bg-danger/10 border border-danger/30 rounded-2xl p-4 flex items-start gap-3 glow-red"
                >
                  <span className="text-2xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="font-bold text-danger-light">Attendance Below Required Threshold!</p>
                    <p className="text-sm text-danger/80 mt-0.5">
                      Your attendance is <strong>{stats.percentage}%</strong>, below the required 85%.
                      You need to attend <strong>{Math.ceil(((0.85 * stats.totalSessions) - stats.attended))}</strong> more session(s) to meet the requirement.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main overview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
            >
              <StatCard icon="📅" label="Total Sessions" value={stats?.totalSessions ?? 0} color="blue" />
              <StatCard icon="✅" label="Sessions Attended" value={stats?.attended ?? 0} color="green" />
              <StatCard
                icon={stats?.percentage >= 85 ? '🎯' : '📉'}
                label="Attendance Rate"
                value={`${stats?.percentage ?? 0}%`}
                sub={stats?.percentage >= 85 ? 'Above threshold ✓' : 'Below 85% threshold'}
                color={stats?.percentage >= 85 ? 'green' : 'red'}
              />
            </motion.div>

            {/* Percentage card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-6"
            >
              <GlassCard className={`p-6 ${stats?.percentage >= 85 ? 'glow-green' : 'glow-red'}`}>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <CircularProgress percentage={stats?.percentage ?? 0} />
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-text-primary mb-1">Attendance Overview</h3>
                    <p className="text-text-secondary text-sm mb-4">
                      {stats?.attended} out of {stats?.totalSessions} sessions attended
                    </p>
                    {/* Progress bar */}
                    <div className="w-full bg-white/[0.06] rounded-full h-2.5 mb-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(stats?.percentage ?? 0, 100)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                        className={`h-2.5 rounded-full ${stats?.percentage >= 85 ? 'bg-accent' : stats?.percentage >= 70 ? 'bg-warn' : 'bg-danger'}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>0%</span>
                      <span className="text-warn">85% required</span>
                      <span>100%</span>
                    </div>
                    <div className="mt-4">
                      {stats?.percentage >= 85 ? (
                        <Badge variant="green">✓ Eligible for exams</Badge>
                      ) : (
                        <Badge variant="red">✗ Not eligible — below 85%</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Attendance History */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <GlassCard className="p-6">
                <SectionHeader
                  title="Attendance History"
                  subtitle={`Last ${history.length} sessions`}
                />

                <div className="mt-4 space-y-2">
                  {history.length === 0 ? (
                    <EmptyState
                      icon="📭"
                      title="No attendance records"
                      description="Scan a QR code in class to mark your attendance"
                    />
                  ) : (
                    history.map((record, i) => (
                      <motion.div
                        key={`${record.sessionId}-${i}`}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm">📚</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{record.subject}</p>
                          <p className="text-xs text-text-muted">
                            {record.teacher} · {new Date(record.markedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge variant="green">Present</Badge>
                          <p className="text-xs text-text-muted">{new Date(record.markedAt).toLocaleTimeString()}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
