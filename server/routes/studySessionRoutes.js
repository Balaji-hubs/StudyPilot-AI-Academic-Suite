const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/study-sessions
// List study sessions with pagination and filters
router.get('/', (req, res, next) => {
  try {
    const { mode, subjectId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT ss.*, s.name as subject_name, s.color as subject_color, top.name as topic_name
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      LEFT JOIN topics top ON ss.topic_id = top.id
      WHERE ss.user_id = ?
    `;
    const params = [req.userId];

    if (mode) {
      query += ' AND ss.mode = ?';
      params.push(mode);
    }
    if (subjectId) {
      query += ' AND ss.subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY ss.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const sessions = db.prepare(query).all(...params);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// GET /api/study-sessions/summary
// Returns today's, weekly, monthly, and subject-wise study durations
router.get('/summary', (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Today
    const todayResult = db.prepare(`
      SELECT SUM(duration_minutes) as totalMinutes 
      FROM study_sessions 
      WHERE user_id = ? AND date = ?
    `).get(req.userId, todayStr);
    const todayMinutes = todayResult.totalMinutes || 0;

    // Past 7 days (Weekly)
    const weeklyResult = db.prepare(`
      SELECT SUM(duration_minutes) as totalMinutes 
      FROM study_sessions 
      WHERE user_id = ? AND date >= date('now', '-7 days')
    `).get(req.userId);
    const weeklyMinutes = weeklyResult.totalMinutes || 0;

    // Past 30 days (Monthly)
    const monthlyResult = db.prepare(`
      SELECT SUM(duration_minutes) as totalMinutes 
      FROM study_sessions 
      WHERE user_id = ? AND date >= date('now', '-30 days')
    `).get(req.userId);
    const monthlyMinutes = monthlyResult.totalMinutes || 0;

    // All time total
    const allTimeResult = db.prepare(`
      SELECT SUM(duration_minutes) as totalMinutes, COUNT(*) as sessionCount 
      FROM study_sessions 
      WHERE user_id = ?
    `).get(req.userId);
    const totalMinutes = allTimeResult.totalMinutes || 0;
    const sessionCount = allTimeResult.sessionCount || 0;

    // Subject-wise distribution
    const subjectWise = db.prepare(`
      SELECT s.id, s.name, s.color, SUM(ss.duration_minutes) as minutes
      FROM study_sessions ss
      JOIN subjects s ON ss.subject_id = s.id
      WHERE ss.user_id = ?
      GROUP BY s.id
      ORDER BY minutes DESC
    `).all(req.userId);

    // Mode-wise distribution
    const modeWise = db.prepare(`
      SELECT mode, SUM(duration_minutes) as minutes, COUNT(*) as count
      FROM study_sessions
      WHERE user_id = ?
      GROUP BY mode
    `).all(req.userId);

    res.json({
      todayHours: Number((todayMinutes / 60).toFixed(1)),
      todayMinutes,
      weeklyHours: Number((weeklyMinutes / 60).toFixed(1)),
      weeklyMinutes,
      monthlyHours: Number((monthlyMinutes / 60).toFixed(1)),
      monthlyMinutes,
      totalHours: Number((totalMinutes / 60).toFixed(1)),
      sessionCount,
      subjectWise,
      modeWise
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/study-sessions
// Save completed session (from stopwatch or Pomodoro)
router.post('/', (req, res, next) => {
  try {
    const { subjectId, topicId, startTime, endTime, durationMinutes, mode, notes, date } = req.body;

    if (!durationMinutes || Number(durationMinutes) <= 0) {
      return res.status(400).json({ error: 'Duration must be a positive number of minutes.' });
    }

    const sessionDate = date || new Date().toISOString().slice(0, 10);
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO study_sessions (
        id, user_id, subject_id, topic_id, start_time, end_time, duration_minutes, mode, notes, date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId,
      subjectId || null,
      topicId || null,
      startTime || new Date().toISOString(),
      endTime || new Date().toISOString(),
      Number(durationMinutes),
      mode || 'Focus',
      notes ? notes.trim() : '',
      sessionDate
    );

    const created = db.prepare(`
      SELECT ss.*, s.name as subject_name, s.color as subject_color, top.name as topic_name
      FROM study_sessions ss
      LEFT JOIN subjects s ON ss.subject_id = s.id
      LEFT JOIN topics top ON ss.topic_id = top.id
      WHERE ss.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/study-sessions/:id
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM study_sessions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Study session not found.' });
    }

    db.prepare('DELETE FROM study_sessions WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Study session deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
