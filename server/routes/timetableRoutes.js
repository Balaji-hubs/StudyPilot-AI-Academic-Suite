const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Helper function to check overlapping time slots
function checkTimeOverlap(userId, dayOfWeek, startTime, endTime, excludeId = null) {
  let query = `
    SELECT tt.id, tt.start_time, tt.end_time, tt.room, tt.type, s.name as subject_name
    FROM timetable_entries tt
    JOIN subjects s ON tt.subject_id = s.id
    WHERE tt.user_id = ? AND tt.day_of_week = ?
  `;
  const params = [userId, dayOfWeek];

  if (excludeId) {
    query += ' AND tt.id != ?';
    params.push(excludeId);
  }

  const entries = db.prepare(query).all(...params);

  for (const entry of entries) {
    // Overlap condition: startA < endB AND startB < endA
    if (startTime < entry.end_time && entry.start_time < endTime) {
      return entry; // Conflict found
    }
  }
  return null;
}

// GET /api/timetable
router.get('/', (req, res, next) => {
  try {
    const { day } = req.query;

    let query = `
      SELECT tt.*, s.name as subject_name, s.code as subject_code, s.color as subject_color, top.name as topic_name
      FROM timetable_entries tt
      JOIN subjects s ON tt.subject_id = s.id
      LEFT JOIN topics top ON tt.topic_id = top.id
      WHERE tt.user_id = ?
    `;
    const params = [req.userId];

    if (day) {
      query += ' AND tt.day_of_week = ?';
      params.push(day);
    }

    query += ' ORDER BY tt.start_time ASC';
    const entries = db.prepare(query).all(...params);

    // Group by day for weekly overview
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weekly = {};
    for (const d of daysOrder) {
      weekly[d] = entries.filter(e => e.day_of_week === d);
    }

    res.json({
      entries,
      weekly
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/timetable
router.post('/', (req, res, next) => {
  try {
    const { subjectId, topicId, dayOfWeek, startTime, endTime, room, type, notes } = req.body;

    if (!subjectId || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ error: 'Subject, day of week, start time, and end time are required.' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'Start time must be before end time.' });
    }

    // Check conflict
    const conflict = checkTimeOverlap(req.userId, dayOfWeek, startTime, endTime);
    if (conflict) {
      return res.status(409).json({
        error: `Schedule conflict! Overlaps with ${conflict.subject_name} (${conflict.start_time} - ${conflict.end_time}).`,
        conflict
      });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO timetable_entries (
        id, user_id, subject_id, topic_id, day_of_week, start_time, end_time, room, type, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId,
      subjectId,
      topicId || null,
      dayOfWeek,
      startTime,
      endTime,
      room ? room.trim() : '',
      type || 'Class',
      notes ? notes.trim() : ''
    );

    const created = db.prepare(`
      SELECT tt.*, s.name as subject_name, s.code as subject_code, s.color as subject_color, top.name as topic_name
      FROM timetable_entries tt
      JOIN subjects s ON tt.subject_id = s.id
      LEFT JOIN topics top ON tt.topic_id = top.id
      WHERE tt.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/timetable/:id
router.put('/:id', (req, res, next) => {
  try {
    const { subjectId, topicId, dayOfWeek, startTime, endTime, room, type, notes } = req.body;

    const existing = db.prepare('SELECT * FROM timetable_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Timetable entry not found.' });
    }

    const nextDay = dayOfWeek || existing.day_of_week;
    const nextStart = startTime || existing.start_time;
    const nextEnd = endTime || existing.end_time;

    if (nextStart >= nextEnd) {
      return res.status(400).json({ error: 'Start time must be before end time.' });
    }

    const conflict = checkTimeOverlap(req.userId, nextDay, nextStart, nextEnd, req.params.id);
    if (conflict) {
      return res.status(409).json({
        error: `Schedule conflict! Overlaps with ${conflict.subject_name} (${conflict.start_time} - ${conflict.end_time}).`,
        conflict
      });
    }

    db.prepare(`
      UPDATE timetable_entries
      SET subject_id = COALESCE(?, subject_id),
          topic_id = ?,
          day_of_week = COALESCE(?, day_of_week),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          room = COALESCE(?, room),
          type = COALESCE(?, type),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      subjectId,
      topicId !== undefined ? topicId : null,
      dayOfWeek,
      startTime,
      endTime,
      room !== undefined ? room.trim() : null,
      type,
      notes !== undefined ? notes.trim() : null,
      req.params.id,
      req.userId
    );

    const updated = db.prepare(`
      SELECT tt.*, s.name as subject_name, s.code as subject_code, s.color as subject_color, top.name as topic_name
      FROM timetable_entries tt
      JOIN subjects s ON tt.subject_id = s.id
      LEFT JOIN topics top ON tt.topic_id = top.id
      WHERE tt.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/timetable/:id
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM timetable_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Timetable entry not found.' });
    }

    db.prepare('DELETE FROM timetable_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Timetable entry deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
