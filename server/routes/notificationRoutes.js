const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { syncUserNotifications } = require('../services/notificationService');

router.use(authMiddleware);

// GET /api/notifications
router.get('/', (req, res, next) => {
  try {
    // Run automated check for new notifications first
    syncUserNotifications(req.userId);

    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as c FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.userId).c;

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res, next) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', (req, res, next) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.userId);
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
