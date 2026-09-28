const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const { calculateUserStreak } = require('../services/streakService');

router.use(authMiddleware);

// GET /api/analytics
router.get('/', (req, res, next) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // 1. Weekly Study Hours (past 7 days breakdown)
    const weeklyData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = dayNames[d.getDay()];

      const result = db.prepare(`
        SELECT SUM(duration_minutes) as mins 
        FROM study_sessions 
        WHERE user_id = ? AND date = ?
      `).get(userId, dateStr);

      const hours = result && result.mins ? Number((result.mins / 60).toFixed(1)) : 0;
      weeklyData.push({
        date: dateStr,
        day: dayLabel,
        hours
      });
    }

    // 2. Monthly Study Trends (past 4 weeks)
    const monthlyTrends = [];
    for (let w = 3; w >= 0; w--) {
      const startD = new Date();
      startD.setDate(startD.getDate() - ((w + 1) * 7));
      const endD = new Date();
      endD.setDate(endD.getDate() - (w * 7));

      const sStr = startD.toISOString().slice(0, 10);
      const eStr = endD.toISOString().slice(0, 10);

      const result = db.prepare(`
        SELECT SUM(duration_minutes) as mins 
        FROM study_sessions 
        WHERE user_id = ? AND date >= ? AND date <= ?
      `).get(userId, sStr, eStr);

      const hours = result && result.mins ? Number((result.mins / 60).toFixed(1)) : 0;
      monthlyTrends.push({
        week: `Week ${4 - w}`,
        hours
      });
    }

    // 3. Subject-wise study time distribution (for Pie/Donut chart)
    const subjectDistribution = db.prepare(`
      SELECT s.name, s.color, COALESCE(SUM(ss.duration_minutes), 0) as totalMinutes
      FROM subjects s
      LEFT JOIN study_sessions ss ON s.id = ss.subject_id AND ss.user_id = ?
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY totalMinutes DESC
    `).all(userId, userId).map(item => ({
      name: item.name,
      color: item.color,
      hours: Number((item.totalMinutes / 60).toFixed(1)),
      minutes: item.totalMinutes
    }));

    // 4. Task Completion Metrics
    const taskStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'Pending' AND (due_date IS NULL OR due_date >= ?) THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status != 'Completed' AND due_date IS NOT NULL AND due_date < ? THEN 1 ELSE 0 END) as overdue
      FROM tasks 
      WHERE user_id = ?
    `).get(todayStr, todayStr, userId);

    const tasksCompleted = taskStats.completed || 0;
    const tasksTotal = taskStats.total || 0;
    const taskCompletionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

    // 5. Subject Attendance vs Target
    const subjects = db.prepare('SELECT id, name, color, target_percentage FROM subjects WHERE user_id = ?').all(userId);
    const attendanceComparison = subjects.map(sub => {
      const att = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as attended
        FROM attendance_records 
        WHERE user_id = ? AND subject_id = ?
      `).get(userId, sub.id);

      const total = att.total || 0;
      const attended = att.attended || 0;
      const percentage = total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0;

      return {
        subject: sub.name,
        color: sub.color,
        attendance: percentage,
        target: sub.target_percentage,
        totalClasses: total,
        attendedClasses: attended
      };
    });

    // 6. Topics Completion Progress
    const topicStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN is_weak = 1 THEN 1 ELSE 0 END) as weak
      FROM topics
      WHERE user_id = ?
    `).get(userId);

    const totalTopics = topicStats.total || 0;
    const topicsCompleted = topicStats.completed || 0;
    const weakTopics = topicStats.weak || 0;
    const topicCompletionRate = totalTopics > 0 ? Math.round((topicsCompleted / totalTopics) * 100) : 0;

    // 7. Overall Summary Stats
    const totalStudyResult = db.prepare('SELECT SUM(duration_minutes) as mins FROM study_sessions WHERE user_id = ?').get(userId);
    const totalStudyHours = Number(((totalStudyResult?.mins || 0) / 60).toFixed(1));

    // Active days count for average daily study calculation
    const streakInfo = calculateUserStreak(userId);
    const activeDaysCount = Math.max(1, streakInfo.totalActiveDays);
    const avgDailyHours = Number((totalStudyHours / activeDaysCount).toFixed(1));

    // Overall attendance average
    let overallAttendance = 0;
    const subjectsWithAtt = attendanceComparison.filter(s => s.totalClasses > 0);
    if (subjectsWithAtt.length > 0) {
      const sum = subjectsWithAtt.reduce((acc, curr) => acc + curr.attendance, 0);
      overallAttendance = Number((sum / subjectsWithAtt.length).toFixed(1));
    }

    res.json({
      summary: {
        totalStudyHours,
        avgDailyHours,
        tasksCompleted,
        tasksTotal,
        taskCompletionRate,
        topicsCompleted,
        totalTopics,
        weakTopics,
        topicCompletionRate,
        currentStreak: streakInfo.currentStreak,
        bestStreak: streakInfo.bestStreak,
        overallAttendance
      },
      charts: {
        weeklyData,
        monthlyTrends,
        subjectDistribution,
        taskBreakdown: [
          { name: 'Completed', value: tasksCompleted, color: '#10b981' },
          { name: 'In Progress', value: taskStats.inProgress || 0, color: '#3b82f6' },
          { name: 'Pending', value: taskStats.pending || 0, color: '#f59e0b' },
          { name: 'Overdue', value: taskStats.overdue || 0, color: '#ef4444' }
        ],
        attendanceComparison
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
