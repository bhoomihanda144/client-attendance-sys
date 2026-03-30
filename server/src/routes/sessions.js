const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// POST /create-session
router.post('/create-session', async (req, res) => {
  try {
    const { teacherId, subject } = req.body;
    if (!teacherId) return res.status(400).json({ error: 'teacherId required' });

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can create sessions' });
    }

    const sessionId = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

    const session = await Session.create({
      sessionId,
      createdBy: teacherId,
      subject: subject || 'General'
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      subject: session.subject,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /generate-qr/:sessionId
router.get('/generate-qr/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId, isActive: true });
    if (!session) return res.status(404).json({ error: 'Session not found or expired' });

    if (new Date() > session.expiresAt) {
      await Session.findOneAndUpdate({ sessionId }, { isActive: false });
      return res.status(410).json({ error: 'Session expired' });
    }

    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const qrUrl = `${backendUrl}/api/attendance/mark?session=${sessionId}`;

    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      qrCode: qrDataUrl,
      qrUrl,
      sessionId,
      expiresAt: session.expiresAt
    });
  } catch (err) {
    console.error('QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// GET /session-attendance/:sessionId
router.get('/session-attendance/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId }).populate('createdBy', 'name email');
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const records = await Attendance.find({ sessionId })
      .populate('studentId', 'name email')
      .sort({ markedAt: -1 });

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        subject: session.subject,
        createdBy: session.createdBy,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        isActive: session.isActive && new Date() < session.expiresAt
      },
      attendance: records.map(r => ({
        student: r.studentId,
        markedAt: r.markedAt
      })),
      totalMarked: records.length
    });
  } catch (err) {
    console.error('Session attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch session attendance' });
  }
});

// GET /teacher-sessions/:teacherId
router.get('/teacher-sessions/:teacherId', async (req, res) => {
  try {
    const sessions = await Session.find({ createdBy: req.params.teacherId })
      .sort({ createdAt: -1 })
      .limit(20);

    const sessionsWithCount = await Promise.all(sessions.map(async (s) => {
      const count = await Attendance.countDocuments({ sessionId: s.sessionId });
      return {
        sessionId: s.sessionId,
        subject: s.subject,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isActive: s.isActive && new Date() < s.expiresAt,
        attendanceCount: count
      };
    }));

    res.json({ success: true, sessions: sessionsWithCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// PUT /end-session/:sessionId
router.put('/end-session/:sessionId', async (req, res) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId: req.params.sessionId },
      { isActive: false }
    );
    res.json({ success: true, message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

module.exports = router;
