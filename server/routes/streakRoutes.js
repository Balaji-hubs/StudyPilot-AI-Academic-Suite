const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { calculateUserStreak } = require('../services/streakService');

router.use(authMiddleware);

// GET /api/streak
router.get('/', (req, res, next) => {
  try {
    const streakData = calculateUserStreak(req.userId);
    res.json(streakData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
