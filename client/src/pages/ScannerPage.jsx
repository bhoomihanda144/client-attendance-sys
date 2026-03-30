import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Navbar from '../components/Navbar';
import { GlassCard, Spinner } from '../components/UI';

export default function ScannerPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [scannerReady, setScannerReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'duplicate'|'error'|'expired', message }
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  // If session param from URL redirect, auto-mark
  const sessionFromUrl = searchParams.get('session');
  const errorFromUrl = searchParams.get('error');

  useEffect(() => {
    if (errorFromUrl) {
      const msgs = {
        session_not_found: 'Session not found. It may have been deleted.',
        session_expired: 'This session has expired.',
        no_session: 'No session ID provided.',
      };
      setResult({ type: 'error', message: msgs[errorFromUrl] || 'An error occurred.' });
      return;
    }
    if (sessionFromUrl) {
      handleMarkAttendance(sessionFromUrl);
    }
  }, [sessionFromUrl, errorFromUrl]);

  const handleMarkAttendance = async (sessionId) => {
    if (!user || marking) return;
    setMarking(true);
    setResult(null);
    try {
      await api.markAttendance(sessionId, user._id);
      setResult({
        type: 'success',
        message: `Attendance marked successfully! ✅`,
        sessionId
      });
      stopScanner();
    } catch (err) {
      if (err.code === 'DUPLICATE' || err.status === 409) {
        setResult({ type: 'duplicate', message: 'Attendance already marked for this session ❌' });
      } else if (err.code === 'SESSION_EXPIRED' || err.status === 410) {
        setResult({ type: 'expired', message: 'This session has expired. Ask your teacher to start a new one.' });
      } else if (err.code === 'SESSION_NOT_FOUND' || err.status === 404) {
        setResult({ type: 'error', message: 'Session not found. Please scan a valid QR code.' });
      } else {
        setResult({ type: 'error', message: err.error || 'Failed to mark attendance.' });
      }
    } finally {
      setMarking(false);
    }
  };

  const startScanner = async () => {
    setError('');
    setResult(null);
    const { Html5Qrcode } = await import('html5-qrcode');
    try {
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;
      setScannerReady(true);
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // Extract session from URL
          try {
            const url = new URL(decodedText);
            const session = url.searchParams.get('session');
            if (session) {
              handleMarkAttendance(session);
              return;
            }
          } catch { /* not a URL */ }
          // Fallback: treat entire text as session ID
          if (decodedText && decodedText.length > 4) {
            handleMarkAttendance(decodedText);
          }
        },
        () => { /* ignore scan failures */ }
      );
    } catch (err) {
      setScannerReady(false);
      setScanning(false);
      if (err.message?.includes('permission') || err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else {
        setError('Could not start camera: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try { await html5QrRef.current.stop(); } catch { /* ignore */ }
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const resultStyle = {
    success: { bg: 'bg-accent/10 border-accent/30', text: 'text-accent-light', icon: '✅', glow: 'glow-green' },
    duplicate: { bg: 'bg-danger/10 border-danger/30', text: 'text-danger-light', icon: '❌', glow: 'glow-red' },
    expired: { bg: 'bg-warn/10 border-warn/30', text: 'text-warn-light', icon: '⏰', glow: '' },
    error: { bg: 'bg-danger/10 border-danger/30', text: 'text-danger-light', icon: '⚠️', glow: 'glow-red' },
  };

  return (
    <div className="min-h-screen bg-bg-primary grid-bg">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Scan QR Code</h1>
          <p className="text-text-secondary text-sm mt-1">Point your camera at the teacher's QR code</p>
        </motion.div>

        {/* Auto-marking state */}
        {sessionFromUrl && marking && (
          <GlassCard className="p-8 text-center mb-6">
            <Spinner size="lg" />
            <p className="text-text-secondary mt-4">Marking your attendance...</p>
            <p className="text-text-muted text-xs mt-1 font-mono">{sessionFromUrl}</p>
          </GlassCard>
        )}

        {/* Result banner */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`mb-6 border rounded-2xl p-6 text-center ${resultStyle[result.type].bg} ${resultStyle[result.type].glow}`}
            >
              <div className="text-5xl mb-3">{resultStyle[result.type].icon}</div>
              <p className={`font-semibold text-base ${resultStyle[result.type].text}`}>
                {result.message}
              </p>
              {result.type === 'success' && (
                <button
                  onClick={() => navigate('/student')}
                  className="mt-4 btn-primary text-sm px-6 py-2.5"
                >
                  View My Attendance →
                </button>
              )}
              {(result.type === 'duplicate' || result.type === 'error' || result.type === 'expired') && (
                <button
                  onClick={() => { setResult(null); if (!sessionFromUrl) startScanner(); }}
                  className="mt-4 btn-secondary text-sm px-6 py-2.5"
                >
                  Try Again
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner UI */}
        {!sessionFromUrl && !result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard className={`p-4 ${scanning ? 'glow-green' : ''}`}>
              <div className="relative">
                {/* Camera view */}
                <div id="qr-reader" className="rounded-xl overflow-hidden" style={{ minHeight: scanning ? 'auto' : '0' }} />

                {/* Overlay frame when scanning */}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent rounded-br-lg" />
                      {/* Scanning line */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-accent/60 animate-scan" />
                    </div>
                  </div>
                )}

                {/* Idle state */}
                {!scanning && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-4xl">
                      📷
                    </div>
                    <p className="text-text-secondary text-sm text-center">
                      Camera is ready. Tap below to start scanning.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4">
                {error && (
                  <div className="bg-danger/10 border border-danger/30 text-danger-light text-sm rounded-xl px-4 py-3 mb-4 text-center">
                    {error}
                  </div>
                )}

                {!scanning ? (
                  <button onClick={startScanner} className="btn-primary w-full flex items-center justify-center gap-2">
                    📷 Start Scanner
                  </button>
                ) : (
                  <button onClick={stopScanner} className="btn-danger w-full flex items-center justify-center gap-2">
                    <div className="w-3 h-3 bg-white rounded-sm" />
                    Stop Scanner
                  </button>
                )}
              </div>
            </GlassCard>

            <GlassCard className="mt-4 p-4">
              <p className="text-xs text-text-muted text-center leading-relaxed">
                💡 Make sure your teacher's QR code is visible on their screen.<br />
                Hold your phone steady 6–10 inches from the screen.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
