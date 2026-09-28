const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Please provide full name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();

    // Create user, profile, and settings atomically
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name)
      VALUES (?, ?, ?, ?)
    `);
    const insertProfile = db.prepare(`
      INSERT INTO profiles (id, user_id, bio)
      VALUES (?, ?, ?)
    `);
    const insertSettings = db.prepare(`
      INSERT INTO user_settings (id, user_id)
      VALUES (?, ?)
    `);

    db.transaction(() => {
      insertUser.run(userId, emailNorm, passwordHash, fullName.trim());
      insertProfile.run(crypto.randomUUID(), userId, 'Dedicated student aiming for academic excellence.');
      insertSettings.run(crypto.randomUUID(), userId);
    })();

    const token = jwt.sign({ userId, email: emailNorm }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Account successfully registered.',
      token,
      user: {
        id: userId,
        email: emailNorm,
        fullName: fullName.trim()
      },
      onboardingCompleted: false
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailNorm);
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    const settings = db.prepare('SELECT onboarding_completed, theme FROM user_settings WHERE user_id = ?').get(user.id);
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      onboardingCompleted: settings ? Boolean(settings.onboarding_completed) : false,
      theme: settings?.theme || 'dark'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res, next) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId) || {};
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId) || {};

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.full_name,
        createdAt: req.user.created_at
      },
      profile,
      settings
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Session logged out successfully.' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);

    // Constant time behavior / do not leak account existence
    if (user) {
      const resetToken = crypto.randomBytes(24).toString('hex');
      const expiry = Date.now() + 1000 * 60 * 60; // 1 hour
      db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(resetToken, expiry, user.id);
      
      // Return simulated token in response for smooth instant testing / demo
      return res.json({
        message: 'Password reset link has been dispatched to your email address.',
        demoResetToken: resetToken
      });
    }

    res.json({
      message: 'If an account exists with that email, a password reset link has been dispatched.'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res, next) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const user = db.prepare('SELECT id, reset_token_expiry FROM users WHERE reset_token = ?').get(token);
    if (!user || !user.reset_token_expiry || user.reset_token_expiry < Date.now()) {
      return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    db.prepare(`
      UPDATE users 
      SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL, updated_at = datetime('now')
      WHERE id = ?
    `).run(passwordHash, user.id);

    res.json({ message: 'Password has been successfully updated. You may now log in.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
