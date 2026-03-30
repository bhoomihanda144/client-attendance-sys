const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');

// POST /mark-attendance (from QR scan via API)
router.post('/mark', async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;
    if (!sessionId || !studentId) {
      return res.status(400).json({ error: 'sessionId and studentId are required' });
    }

    const session = await Session.findOne({ sessionId });
    if (!session) return res.status(404).json({ error: 'Session not found', code: 'SESSION_NOT_FOUND' });
    if (!session.isActive || new Date() > session.expiresAt) {
      return res.status(410).json({ error: 'Session expired', code: 'SESSION_EXPIRED' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ error: 'Only students can mark attendance', code: 'UNAUTHORIZED' });
    }

    const existing = await Attendance.findOne({ studentId, sessionId });
    if (existing) {
      return res.status(409).json({
        error: 'Attendance already marked',
        code: 'DUPLICATE',
        markedAt: existing.markedAt
      });
    }

    const record = await Attendance.create({ studentId, sessionId });
    res.json({
      success: true,
      message: 'Attendance marked successfully',
      markedAt: record.markedAt,
      student: { name: student.name, email: student.email },
      session: { sessionId, subject: session.subject }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Attendance already marked', code: 'DUPLICATE' });
    }
    console.error('Mark attendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /mark (from QR redirect - browser scan)
router.get('/mark', async (req, res) => {
  const { session: sessionId } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!sessionId) {
    return res.redirect(`${frontendUrl}/scan?error=no_session`);
  }

  const sessionDoc = await Session.findOne({ sessionId }).catch(() => null);
  if (!sessionDoc) {
    return res.redirect(`${frontendUrl}/scan?error=session_not_found&session=${sessionId}`);
  }
  if (!sessionDoc.isActive || new Date() > sessionDoc.expiresAt) {
    return res.redirect(`${frontendUrl}/scan?error=session_expired&session=${sessionId}`);
  }

  // Redirect to frontend scanner page with session param
  return res.redirect(`${frontendUrl}/scan?session=${sessionId}`);
});

// GET /student-attendance/:studentId
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // All sessions
    const allSessions = await Session.find({});
    const totalSessions = allSessions.length;

    // Sessions attended by student
    const attendedRecords = await Attendance.find({ studentId })
      .populate('studentId', 'name email')
      .sort({ markedAt: -1 });

    const attended = attendedRecords.length;
    const percentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

    // Enrich with session info
    const history = await Promise.all(attendedRecords.slice(0, 20).map(async (record) => {
      const session = await Session.findOne({ sessionId: record.sessionId }).populate('createdBy', 'name');
      return {
        sessionId: record.sessionId,
        subject: session?.subject || 'Unknown',
        markedAt: record.markedAt,
        teacher: session?.createdBy?.name || 'Unknown'
      };
    }));

    res.json({
      success: true,
      student: { name: student.name, email: student.email },
      stats: {
        totalSessions,
        attended,
        percentage,
        belowThreshold: percentage < 85
      },
      history
    });
  } catch (err) {
    console.error('Student attendance error:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

module.exports = router;
