const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/subjects
router.get('/', (req, res, next) => {
  try {
    const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ? ORDER BY name ASC').all(req.userId);

    const enrichedSubjects = subjects.map(sub => {
      // Topic counts
      const topicStats = db.prepare(`
        SELECT 
          COUNT(*) as totalTopics,
          SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completedTopics,
          SUM(CASE WHEN is_weak = 1 THEN 1 ELSE 0 END) as weakTopics
        FROM topics 
        WHERE user_id = ? AND subject_id = ?
      `).get(req.userId, sub.id);

      const totalTopics = topicStats.totalTopics || 0;
      const completedTopics = topicStats.completedTopics || 0;
      const pendingTopics = totalTopics - completedTopics;
      const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      // Study hours
      const studyStats = db.prepare(`
        SELECT SUM(duration_minutes) as totalMinutes 
        FROM study_sessions 
        WHERE user_id = ? AND subject_id = ?
      `).get(req.userId, sub.id);
      const studyHours = ((studyStats.totalMinutes || 0) / 60).toFixed(1);

      // Attendance
      const attStats = db.prepare(`
        SELECT 
          COUNT(*) as totalClasses,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as attendedClasses
        FROM attendance_records 
        WHERE user_id = ? AND subject_id = ?
      `).get(req.userId, sub.id);
      const totalClasses = attStats.totalClasses || 0;
      const attendedClasses = attStats.attendedClasses || 0;
      const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : null;

      // Upcoming exams for this subject
      const todayStr = new Date().toISOString().slice(0, 10);
      const upcomingExams = db.prepare(`
        SELECT id, name, exam_date, exam_type 
        FROM exams 
        WHERE user_id = ? AND subject_id = ? AND exam_date >= ?
        ORDER BY exam_date ASC
      `).all(req.userId, sub.id, todayStr);

      return {
        ...sub,
        totalTopics,
        completedTopics,
        pendingTopics,
        weakTopics: topicStats.weakTopics || 0,
        progressPercentage,
        studyHours: Number(studyHours),
        attendance: {
          totalClasses,
          attendedClasses,
          percentage: attendancePercentage,
          isLow: attendancePercentage !== null && attendancePercentage < sub.target_percentage
        },
        upcomingExams
      };
    });

    res.json(enrichedSubjects);
  } catch (error) {
    next(error);
  }
});

// GET /api/subjects/:id
router.get('/:id', (req, res, next) => {
  try {
    const sub = db.prepare('SELECT * FROM subjects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!sub) {
      return res.status(404).json({ error: 'Subject not found.' });
    }
    res.json(sub);
  } catch (error) {
    next(error);
  }
});

// POST /api/subjects
router.post('/', (req, res, next) => {
  try {
    const { name, code, teacher, targetPercentage, color, icon, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO subjects (id, user_id, name, code, teacher, target_percentage, color, icon, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.userId,
      name.trim(),
      code ? code.trim() : '',
      teacher ? teacher.trim() : '',
      targetPercentage ? Number(targetPercentage) : 75.0,
      color || '#6366f1',
      icon || 'BookOpen',
      description ? description.trim() : ''
    );

    const created = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/subjects/:id
router.put('/:id', (req, res, next) => {
  try {
    const { name, code, teacher, targetPercentage, color, icon, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Subject name is required.' });
    }

    const existing = db.prepare('SELECT id FROM subjects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    db.prepare(`
      UPDATE subjects 
      SET name = ?, code = ?, teacher = ?, target_percentage = ?, color = ?, icon = ?, description = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      name.trim(),
      code ? code.trim() : '',
      teacher ? teacher.trim() : '',
      targetPercentage ? Number(targetPercentage) : 75.0,
      color || '#6366f1',
      icon || 'BookOpen',
      description ? description.trim() : '',
      req.params.id,
      req.userId
    );

    const updated = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/subjects/:id
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM subjects WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    db.prepare('DELETE FROM subjects WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Subject and all associated topics deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
