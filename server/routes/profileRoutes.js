const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/profile
router.get('/', (req, res, next) => {
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.full_name,
        createdAt: req.user.created_at
      },
      profile: profile || {}
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile
router.put('/', (req, res, next) => {
  try {
    const { fullName, avatarUrl, college, course, branch, year, semester, bio } = req.body;

    if (fullName) {
      db.prepare("UPDATE users SET full_name = ?, updated_at = datetime('now') WHERE id = ?")
        .run(fullName.trim(), req.userId);
    }

    db.prepare(`
      UPDATE profiles 
      SET avatar_url = COALESCE(?, avatar_url),
          college = COALESCE(?, college),
          course = COALESCE(?, course),
          branch = COALESCE(?, branch),
          year = COALESCE(?, year),
          semester = COALESCE(?, semester),
          bio = COALESCE(?, bio),
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(avatarUrl, college, course, branch, year, semester, bio, req.userId);

    const updatedProfile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
    const updatedUser = db.prepare('SELECT id, email, full_name FROM users WHERE id = ?').get(req.userId);

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser,
      profile: updatedProfile
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile/change-password
router.put('/change-password', (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);

    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .run(newHash, req.userId);

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
