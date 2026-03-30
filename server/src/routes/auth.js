const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Helper: detect role from email
function detectRole(email) {
  email = email.toLowerCase().trim();
  if (email === 'teacher@drait.edu.in') return 'teacher';
  // Pattern: digits + letters (e.g. 1da23cs031@drait.edu.in)
  if (/^\d[a-z0-9]+@drait\.edu\.in$/.test(email)) return 'student';
  return null;
}

// Helper: extract name from email
function nameFromEmail(email) {
  const local = email.split('@')[0];
  if (email === 'teacher@drait.edu.in') return 'Teacher';
  return local.toUpperCase();
}

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const role = detectRole(email);
    if (!role) {
      return res.status(403).json({ error: 'Unauthorized email domain. Use @drait.edu.in email.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        name: nameFromEmail(email),
        role
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
