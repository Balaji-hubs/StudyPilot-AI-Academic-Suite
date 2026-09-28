const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', (req, res, next) => {
  try {
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId) || {};
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings
router.put('/', (req, res, next) => {
  try {
    const {
      theme,
      enableReminders,
      examReminders,
      taskReminders,
      studyReminders,
      dailyStudyTargetMinutes,
      preferredStudyTime,
      pomodoroFocusMin,
      pomodoroShortBreakMin,
      pomodoroLongBreakMin,
      attendanceTargetPct
    } = req.body;

    db.prepare(`
      UPDATE user_settings 
      SET theme = COALESCE(?, theme),
          enable_reminders = COALESCE(?, enable_reminders),
          exam_reminders = COALESCE(?, exam_reminders),
          task_reminders = COALESCE(?, task_reminders),
          study_reminders = COALESCE(?, study_reminders),
          daily_study_target_minutes = COALESCE(?, daily_study_target_minutes),
          preferred_study_time = COALESCE(?, preferred_study_time),
          pomodoro_focus_min = COALESCE(?, pomodoro_focus_min),
          pomodoro_short_break_min = COALESCE(?, pomodoro_short_break_min),
          pomodoro_long_break_min = COALESCE(?, pomodoro_long_break_min),
          attendance_target_pct = COALESCE(?, attendance_target_pct),
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(
      theme,
      enableReminders !== undefined ? (enableReminders ? 1 : 0) : null,
      examReminders !== undefined ? (examReminders ? 1 : 0) : null,
      taskReminders !== undefined ? (taskReminders ? 1 : 0) : null,
      studyReminders !== undefined ? (studyReminders ? 1 : 0) : null,
      dailyStudyTargetMinutes !== undefined ? Number(dailyStudyTargetMinutes) : null,
      preferredStudyTime,
      pomodoroFocusMin !== undefined ? Number(pomodoroFocusMin) : null,
      pomodoroShortBreakMin !== undefined ? Number(pomodoroShortBreakMin) : null,
      pomodoroLongBreakMin !== undefined ? Number(pomodoroLongBreakMin) : null,
      attendanceTargetPct !== undefined ? Number(attendanceTargetPct) : null,
      req.userId
    );

    const updated = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.userId);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/settings/onboarding
// Save onboarding data and mark completed
router.post('/onboarding', (req, res, next) => {
  try {
    const {
      college,
      course,
      branch,
      year,
      semester,
      dailyStudyHours,
      studyTarget,
      preferredStudyTime
    } = req.body;

    const dailyMinutes = dailyStudyHours ? Math.round(Number(dailyStudyHours) * 60) : 180;

    // Update profile
    db.prepare(`
      UPDATE profiles 
      SET college = COALESCE(?, college),
          course = COALESCE(?, course),
          branch = COALESCE(?, branch),
          year = COALESCE(?, year),
          semester = COALESCE(?, semester),
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(college, course, branch, year, semester, req.userId);

    // Update settings and mark onboarding complete
    db.prepare(`
      UPDATE user_settings 
      SET daily_study_target_minutes = ?,
          preferred_study_time = COALESCE(?, preferred_study_time),
          onboarding_completed = 1,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(dailyMinutes, preferredStudyTime, req.userId);

    res.json({ message: 'Onboarding completed successfully.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/settings/export
// Export complete student dataset
router.get('/export', (req, res, next) => {
  try {
    const { format = 'json' } = req.query;

    const user = db.prepare('SELECT id, email, full_name, created_at FROM users WHERE id = ?').get(req.userId);
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
    const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ?').all(req.userId);
    const topics = db.prepare('SELECT * FROM topics WHERE user_id = ?').all(req.userId);
    const tasks = db.prepare('SELECT * FROM tasks WHERE user_id = ?').all(req.userId);
    const exams = db.prepare('SELECT * FROM exams WHERE user_id = ?').all(req.userId);
    const timetable = db.prepare('SELECT * FROM timetable_entries WHERE user_id = ?').all(req.userId);
    const attendance = db.prepare('SELECT * FROM attendance_records WHERE user_id = ?').all(req.userId);
    const studySessions = db.prepare('SELECT * FROM study_sessions WHERE user_id = ?').all(req.userId);

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      student: user,
      profile,
      subjects,
      topics,
      tasks,
      exams,
      timetable,
      attendance,
      studySessions
    };

    if (format === 'csv') {
      // Export tasks as CSV sample
      let csv = 'ID,Title,Priority,Status,DueDate,EstimatedMinutes,CompletedAt\n';
      tasks.forEach(t => {
        csv += `"${t.id}","${(t.title || '').replace(/"/g, '""')}","${t.priority}","${t.status}","${t.due_date || ''}",${t.estimated_minutes},"${t.completed_at || ''}"\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ai_study_planner_tasks.csv"');
      return res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="ai_study_planner_backup.json"');
    res.json(exportData);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/settings/account
// Delete user account and cascade delete all records
router.delete('/account', (req, res, next) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
    res.json({ message: 'User account and all associated academic data deleted permanently.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
