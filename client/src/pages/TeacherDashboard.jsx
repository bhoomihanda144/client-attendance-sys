import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { GlassCard, StatCard, Badge, Spinner, EmptyState, SectionHeader, Avatar } from '../components/UI';
import Navbar from '../components/Navbar';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState('');
  const [showNewSession, setShowNewSession] = useState(false);
  const pollRef = useRef(null);

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.getTeacherSessions(user._id);
      setSessions(data.sessions || []);
    } catch { /* silent */ } finally {
      setLoadingSessions(false);
    }
  }, [user._id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Poll attendance when session is active
  useEffect(() => {
    if (!activeSession) return;
    const poll = async () => {
      try {
        const data = await api.getSessionAttendance(activeSession.sessionId);
        setAttendance(data.attendance || []);
      } catch { /* silent */ }
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, [activeSession]);

  const handleCreateSession = async () => {
    if (!subject.trim()) return;
    setCreating(true);
    setError('');
    try {
      const sessionData = await api.createSession(user._id, subject);
      const qrData = await api.generateQR(sessionData.sessionId);
      setActiveSession(sessionData);
      setQrCode(qrData);
      setAttendance([]);
      setShowNewSession(false);
      setSubject('');
      loadSessions();
    } catch (err) {
      setError(err.error || 'Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      await api.endSession(activeSession.sessionId);
      setActiveSession(null);
      setQrCode(null);
      setAttendance([]);
      clearInterval(pollRef.current);
      loadSessions();
    } catch { /* silent */ }
  };

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.isActive).length;

  return (
    <div className="min-h-screen bg-bg-primary grid-bg">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
                Teacher Dashboard
              </h1>
              <p className="text-text-secondary mt-1 text-sm">
                Manage attendance sessions and monitor students in real-time
              </p>
            </div>
            <button
              onClick={() => setShowNewSession(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <span className="text-lg leading-none">+</span>
              Start New Session
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8"
        >
          <StatCard icon="📋" label="Total Sessions" value={totalSessions} color="blue" />
          <StatCard icon="🟢" label="Active Now" value={activeSessions} color="green" />
          {activeSession && (
            <StatCard icon="👥" label="Marked Today" value={attendance.length} sub={activeSession.subject} color="green" />
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: QR Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            {activeSession && qrCode ? (
              <GlassCard className="p-6" glow="green">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider">Live Session</span>
                    </div>
                    <h3 className="font-bold text-text-primary">{activeSession.subject}</h3>
                    <p className="text-xs font-mono text-text-muted mt-0.5">ID: {activeSession.sessionId}</p>
                  </div>
                  <button onClick={handleEndSession} className="btn-danger text-xs px-4 py-2">
                    End Session
                  </button>
                </div>

                {/* QR Code */}
                <div className="bg-white rounded-2xl p-4 flex items-center justify-center shadow-glow-green">
                  <img src={qrCode.qrCode} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl" />
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-text-secondary mb-1">Students scan this QR to mark attendance</p>
                  <p className="text-xs font-mono text-text-muted break-all px-2 leading-relaxed">{qrCode.qrUrl}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-text-muted">
                  <span>Expires: {new Date(activeSession.expiresAt || qrCode.expiresAt).toLocaleTimeString()}</span>
                  <Badge variant="green">● Active</Badge>
                </div>
              </GlassCard>
            ) : (
              <GlassCard className="p-6">
                <EmptyState
                  icon="📡"
                  title="No Active Session"
                  description="Start a new session to generate a QR code for students to scan"
                />
                <button
                  onClick={() => setShowNewSession(true)}
                  className="btn-primary w-full mt-4 text-sm"
                >
                  + Start New Session
                </button>
              </GlassCard>
            )}
          </motion.div>

          {/* Right: Live Attendance */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <GlassCard className="p-6 h-full">
              <SectionHeader
                title={activeSession ? "Live Attendance" : "Recent Sessions"}
                subtitle={activeSession ? `${attendance.length} student${attendance.length !== 1 ? 's' : ''} marked` : `${sessions.length} total sessions`}
              />

              <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {activeSession ? (
                  attendance.length === 0 ? (
                    <EmptyState icon="⏳" title="Waiting for students..." description="Students will appear here as they scan the QR code" />
                  ) : (
                    <AnimatePresence>
                      {attendance.map((record, i) => (
                        <motion.div
                          key={record.student?._id || i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10"
                        >
                          <Avatar name={record.student?.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{record.student?.name}</p>
                            <p className="text-xs text-text-muted font-mono truncate">{record.student?.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge variant="green">✓</Badge>
                            <p className="text-xs text-text-muted mt-1">{new Date(record.markedAt).toLocaleTimeString()}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )
                ) : loadingSessions ? (
                  <div className="flex justify-center py-8"><Spinner /></div>
                ) : sessions.length === 0 ? (
                  <EmptyState icon="📋" title="No sessions yet" description="Create your first session to get started" />
                ) : (
                  sessions.map((s, i) => (
                    <motion.div
                      key={s.sessionId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.isActive ? 'bg-accent animate-pulse-slow' : 'bg-text-muted'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{s.subject}</p>
                        <p className="text-xs text-text-muted font-mono">{new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-accent">{s.attendanceCount}</p>
                        <p className="text-xs text-text-muted">students</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* New Session Modal */}
      <AnimatePresence>
        {showNewSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-bg-primary/80 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowNewSession(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-strong rounded-3xl p-8 w-full max-w-md shadow-card"
            >
              <h3 className="text-xl font-bold text-text-primary mb-1">Start New Session</h3>
              <p className="text-text-muted text-sm mb-6">Enter subject name to generate QR code</p>

              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Subject / Class Name
              </label>
              <input
                autoFocus
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSession()}
                placeholder="e.g. Data Structures, OS Lab..."
                className="input mb-4"
                disabled={creating}
              />

              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger-light text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowNewSession(false)} className="btn-secondary flex-1" disabled={creating}>
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={creating || !subject.trim()}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <><Spinner size="sm" color="white" /> Creating...</> : '🚀 Generate QR'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
