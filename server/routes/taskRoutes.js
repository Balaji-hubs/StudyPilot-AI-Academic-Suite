const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/tasks
router.get('/', (req, res, next) => {
  try {
    const { view, subjectId, priority, status, search, sortBy } = req.query;
    const todayStr = new Date().toISOString().slice(0, 10);

    let query = `
      SELECT t.*, s.name as subject_name, s.color as subject_color, top.name as topic_name
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN topics top ON t.topic_id = top.id
      WHERE t.user_id = ?
    `;
    const params = [req.userId];

    // Filter by view
    if (view === 'today') {
      query += ' AND t.due_date = ?';
      params.push(todayStr);
    } else if (view === 'upcoming') {
      query += " AND t.due_date > ? AND t.status != 'Completed'";
      params.push(todayStr);
    } else if (view === 'overdue') {
      query += " AND t.due_date < ? AND t.status != 'Completed'";
      params.push(todayStr);
    } else if (view === 'completed') {
      query += " AND t.status = 'Completed'";
    }

    if (subjectId) {
      query += ' AND t.subject_id = ?';
      params.push(subjectId);
    }
    if (priority) {
      query += ' AND t.priority = ?';
      params.push(priority);
    }
    if (status && view !== 'completed' && view !== 'overdue') {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (search && search.trim()) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    // Sort order
    if (sortBy === 'priority') {
      query += ` ORDER BY CASE t.priority 
        WHEN 'Urgent' THEN 1 
        WHEN 'High' THEN 2 
        WHEN 'Medium' THEN 3 
        ELSE 4 END, t.due_date ASC`;
    } else if (sortBy === 'title') {
      query += ' ORDER BY t.title ASC';
    } else {
      // Default: urgent/overdue first, then due_date, then created_at DESC
      query += ` ORDER BY 
        CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END,
        CASE WHEN t.due_date < date('now') THEN 0 ELSE 1 END,
        t.due_date ASC, 
        t.created_at DESC`;
    }

    const tasks = db.prepare(query).all(...params);
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks
router.post('/', (req, res, next) => {
  try {
    const { title, description, subjectId, topicId, priority, status, dueDate, estimatedMinutes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const id = crypto.randomUUID();
    const taskStatus = status || 'Pending';
    const isCompleted = taskStatus === 'Completed' ? 1 : 0;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    db.prepare(`
      INSERT INTO tasks (
        id, user_id, subject_id, topic_id, title, description,
        priority, status, due_date, estimated_minutes, is_completed, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId,
      subjectId || null,
      topicId || null,
      title.trim(),
      description ? description.trim() : '',
      priority || 'Medium',
      taskStatus,
      dueDate || null,
      estimatedMinutes ? Number(estimatedMinutes) : 45,
      isCompleted,
      completedAt
    );

    const created = db.prepare(`
      SELECT t.*, s.name as subject_name, s.color as subject_color, top.name as topic_name
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN topics top ON t.topic_id = top.id
      WHERE t.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/tasks/:id
router.put('/:id', (req, res, next) => {
  try {
    const { title, description, subjectId, topicId, priority, status, dueDate, estimatedMinutes } = req.body;

    const existing = db.prepare('SELECT id, status FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const taskStatus = status !== undefined ? status : existing.status;
    const isCompleted = taskStatus === 'Completed' ? 1 : 0;
    const completedAt = isCompleted ? (existing.status === 'Completed' ? undefined : new Date().toISOString()) : null;

    db.prepare(`
      UPDATE tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          subject_id = ?,
          topic_id = ?,
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          due_date = ?,
          estimated_minutes = COALESCE(?, estimated_minutes),
          is_completed = ?,
          completed_at = COALESCE(?, completed_at),
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      title ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      subjectId !== undefined ? subjectId : null,
      topicId !== undefined ? topicId : null,
      priority,
      taskStatus,
      dueDate !== undefined ? dueDate : null,
      estimatedMinutes !== undefined ? Number(estimatedMinutes) : null,
      isCompleted,
      completedAt,
      req.params.id,
      req.userId
    );

    const updated = db.prepare(`
      SELECT t.*, s.name as subject_name, s.color as subject_color, top.name as topic_name
      FROM tasks t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN topics top ON t.topic_id = top.id
      WHERE t.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', (req, res, next) => {
  try {
    const { status } = req.body;
    const existing = db.prepare('SELECT id, is_completed FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    let nextStatus = status;
    if (!nextStatus) {
      // Toggle
      nextStatus = existing.is_completed ? 'Pending' : 'Completed';
    }

    const isCompleted = nextStatus === 'Completed' ? 1 : 0;
    const completedAt = isCompleted ? new Date().toISOString() : null;

    db.prepare(`
      UPDATE tasks 
      SET status = ?, is_completed = ?, completed_at = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(nextStatus, isCompleted, completedAt, req.params.id, req.userId);

    res.json({ id: req.params.id, status: nextStatus, isCompleted: Boolean(isCompleted), completedAt });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
