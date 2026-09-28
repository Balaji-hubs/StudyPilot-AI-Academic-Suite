const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/topics
router.get('/', (req, res, next) => {
  try {
    const { subjectId, isWeak, isCompleted } = req.query;

    let query = `
      SELECT t.*, s.name as subject_name, s.color as subject_color, s.code as subject_code
      FROM topics t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.user_id = ?
    `;
    const params = [req.userId];

    if (subjectId) {
      query += ' AND t.subject_id = ?';
      params.push(subjectId);
    }
    if (isWeak !== undefined) {
      query += ' AND t.is_weak = ?';
      params.push(isWeak === 'true' || isWeak === '1' ? 1 : 0);
    }
    if (isCompleted !== undefined) {
      query += ' AND t.is_completed = ?';
      params.push(isCompleted === 'true' || isCompleted === '1' ? 1 : 0);
    }

    query += ' ORDER BY s.name ASC, t.importance DESC, t.difficulty DESC, t.name ASC';

    const topics = db.prepare(query).all(...params);
    res.json(topics);
  } catch (error) {
    next(error);
  }
});

// POST /api/topics
router.post('/', (req, res, next) => {
  try {
    const { subjectId, name, difficulty, importance, notes, estimatedMinutes, isWeak } = req.body;

    if (!subjectId || !name || !name.trim()) {
      return res.status(400).json({ error: 'Subject and topic name are required.' });
    }

    // Verify subject ownership
    const subject = db.prepare('SELECT id FROM subjects WHERE id = ? AND user_id = ?').get(subjectId, req.userId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO topics (id, user_id, subject_id, name, difficulty, importance, is_weak, notes, estimated_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId,
      subjectId,
      name.trim(),
      difficulty || 'Medium',
      importance || 'Medium',
      isWeak ? 1 : 0,
      notes ? notes.trim() : '',
      estimatedMinutes ? Number(estimatedMinutes) : 60
    );

    const created = db.prepare(`
      SELECT t.*, s.name as subject_name, s.color as subject_color, s.code as subject_code
      FROM topics t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/topics/:id
router.put('/:id', (req, res, next) => {
  try {
    const { name, difficulty, importance, notes, estimatedMinutes, isCompleted, isWeak, subjectId } = req.body;

    const existing = db.prepare('SELECT id FROM topics WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    db.prepare(`
      UPDATE topics 
      SET name = COALESCE(?, name),
          difficulty = COALESCE(?, difficulty),
          importance = COALESCE(?, importance),
          notes = COALESCE(?, notes),
          estimated_minutes = COALESCE(?, estimated_minutes),
          is_completed = COALESCE(?, is_completed),
          is_weak = COALESCE(?, is_weak),
          subject_id = COALESCE(?, subject_id),
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      name ? name.trim() : null,
      difficulty,
      importance,
      notes !== undefined ? notes.trim() : null,
      estimatedMinutes !== undefined ? Number(estimatedMinutes) : null,
      isCompleted !== undefined ? (isCompleted ? 1 : 0) : null,
      isWeak !== undefined ? (isWeak ? 1 : 0) : null,
      subjectId,
      req.params.id,
      req.userId
    );

    const updated = db.prepare(`
      SELECT t.*, s.name as subject_name, s.color as subject_color, s.code as subject_code
      FROM topics t
      JOIN subjects s ON t.subject_id = s.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/topics/:id/toggle-complete
router.patch('/:id/toggle-complete', (req, res, next) => {
  try {
    const topic = db.prepare('SELECT id, is_completed FROM topics WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const newStatus = topic.is_completed ? 0 : 1;
    db.prepare("UPDATE topics SET is_completed = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, topic.id);

    res.json({ id: topic.id, isCompleted: Boolean(newStatus) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/topics/:id/toggle-weak
router.patch('/:id/toggle-weak', (req, res, next) => {
  try {
    const topic = db.prepare('SELECT id, is_weak FROM topics WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    const newWeak = topic.is_weak ? 0 : 1;
    db.prepare("UPDATE topics SET is_weak = ?, updated_at = datetime('now') WHERE id = ?").run(newWeak, topic.id);

    res.json({ id: topic.id, isWeak: Boolean(newWeak) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/topics/:id
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM topics WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    db.prepare('DELETE FROM topics WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Topic deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
