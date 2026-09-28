const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/attendance
// Returns summary for all subjects + recent logs
router.get('/', (req, res, next) => {
  try {
    const subjects = db.prepare('SELECT id, name, code, color, target_percentage FROM subjects WHERE user_id = ? ORDER BY name ASC').all(req.userId);
    const settings = db.prepare('SELECT attendance_target_pct FROM user_settings WHERE user_id = ?').get(req.userId);
    const globalTarget = settings ? settings.attendance_target_pct : 75.0;

    const summary = subjects.map(sub => {
      const records = db.prepare(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as attended,
               SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM attendance_records 
        WHERE user_id = ? AND subject_id = ?
      `).get(req.userId, sub.id);

      const total = records.total || 0;
      const attended = records.attended || 0;
      const absent = records.absent || 0;
      const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : null;
      const target = sub.target_percentage || globalTarget;
      const isBelowTarget = percentage !== null && percentage < target;

      // Calculate how many more classes needed to reach target if below
      let classesNeededForTarget = 0;
      if (isBelowTarget && target < 100) {
        // (attended + x) / (total + x) >= target/100  =>  x >= (target*total - 100*attended)/(100 - target)
        classesNeededForTarget = Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)));
      }

      return {
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        color: sub.color,
        targetPercentage: target,
        totalClasses: total,
        attendedClasses: attended,
        absentClasses: absent,
        percentage,
        isBelowTarget,
        classesNeededForTarget
      };
    });

    // Recent records
    const recentRecords = db.prepare(`
      SELECT ar.*, s.name as subject_name, s.color as subject_color
      FROM attendance_records ar
      JOIN subjects s ON ar.subject_id = s.id
      WHERE ar.user_id = ?
      ORDER BY ar.date DESC, ar.created_at DESC
      LIMIT 50
    `).all(req.userId);

    res.json({
      summary,
      recentRecords,
      globalTarget
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/attendance
// Mark attendance record
router.post('/', (req, res, next) => {
  try {
    const { subjectId, date, status, notes } = req.body;

    if (!subjectId || !date || !status) {
      return res.status(400).json({ error: 'Subject, date, and status (present/absent) are required.' });
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "present" or "absent".' });
    }

    // Verify subject ownership
    const subject = db.prepare('SELECT id FROM subjects WHERE id = ? AND user_id = ?').get(subjectId, req.userId);
    if (!subject) {
      return res.status(404).json({ error: 'Subject not found.' });
    }

    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO attendance_records (id, user_id, subject_id, date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, subjectId, date, status, notes ? notes.trim() : '');

    const created = db.prepare(`
      SELECT ar.*, s.name as subject_name, s.color as subject_color
      FROM attendance_records ar
      JOIN subjects s ON ar.subject_id = s.id
      WHERE ar.id = ?
    `).get(id);

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/attendance/:id
router.put('/:id', (req, res, next) => {
  try {
    const { date, status, notes } = req.body;

    const existing = db.prepare('SELECT id FROM attendance_records WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    db.prepare(`
      UPDATE attendance_records
      SET date = COALESCE(?, date),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(
      date,
      status,
      notes !== undefined ? notes.trim() : null,
      req.params.id,
      req.userId
    );

    const updated = db.prepare(`
      SELECT ar.*, s.name as subject_name, s.color as subject_color
      FROM attendance_records ar
      JOIN subjects s ON ar.subject_id = s.id
      WHERE ar.id = ?
    `).get(req.params.id);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/attendance/:id
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM attendance_records WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!existing) {
      return res.status(404).json({ error: 'Attendance record not found.' });
    }

    db.prepare('DELETE FROM attendance_records WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.json({ message: 'Attendance record deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
