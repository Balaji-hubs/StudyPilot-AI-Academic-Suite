const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/exams
router.get('/', (req, res, next) => {
  try {
    const exams = db.prepare(`
      SELECT e.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.user_id = ?
      ORDER BY e.exam_date ASC, e.exam_time ASC
    `).all(req.userId);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const enriched = exams.map(exam => {
      const examDate = new Date(exam.exam_date + 'T' + (exam.exam_time || '09:00'));
      const diffMs = examDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const isPast = exam.exam_date < todayStr;

      return {
        ...exam,
        daysRemaining: isPast ? 0 : Math.max(0, daysRemaining),
        isPast,
        isToday: exam.exam_date === todayStr
      };
    });

    const upcoming = enriched.filter(e => !e.isPast);
    const past = enriched.filter(e => e.isPast);

    res.json({
      all: enriched,
      upcoming,
      past,
      total: enriched.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/exams
router.post('/', (req, res, next) => {
  try {
    const { name, subjectId, examDate, examTime, examType, notes, priority } = req.body;

    if (!name || !name.trim() || !subjectId || !examDate) {
      return res.status(400).json({ error: 'Exam name, subject, and exam date are required.' });
    }

    // Verify subject ownership
    const subject = db.prepare('SELECT id FROM subjects WHERE id = ? AND user_id = ?').get(subjectId, req.userId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO exams (id, user_id, subject_id, name, exam_date, exam_time, exam_type, notes, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId,
      subjectId,
      name.trim(),
      examDate,
      examTime || '09:00',
      examType || 'Semester',
      notes ? notes.trim() : '',
      priority || 'High'
    );

    const created = db.prepare(`
      SELECT e.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/exams/:id
router.put('/:id', (req, res, next) => {
  try {
    const { name, subjectId, examDate, examTime, examType, notes, priority } = req.body;

    const existing = db.prepare('SELECT id FROM exams WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    db.prepare(`
      UPDATE exams
      SET name = COALESCE(?, name),
          subject_id = COALESCE(?, subject_id),
          exam_date = COALESCE(?, exam_date),
          exam_time = COALESCE(?, exam_time),
          exam_type = COALESCE(?, exam_type),
          notes = COALESCE(?, notes),
          priority = COALESCE(?, priority),
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      name ? name.trim() : null,
      subjectId,
      examDate,
      examTime,
      examType,
      notes !== undefined ? notes.trim() : null,
      priority,
      req.params.id,
      req.userId
    );

    const updated = db.prepare(`
      SELECT e.*, s.name as subject_name, s.code as subject_code, s.color as subject_color
      FROM exams e
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/exams/:id
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM exams WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Exam not found.' });
    }

    db.prepare('DELETE FROM exams WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Exam deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
