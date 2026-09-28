const crypto = require('crypto');
const db = require('../database/db');

function syncUserNotifications(userId) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();

  // 1. Check upcoming exams within 7 days
  const exams = db.prepare(`
    SELECT e.id, e.name, e.exam_date, s.name as subject_name 
    FROM exams e 
    JOIN subjects s ON e.subject_id = s.id 
    WHERE e.user_id = ? AND e.exam_date >= ?
    ORDER BY e.exam_date ASC
  `).all(userId, todayStr);

  for (const exam of exams) {
    const examDate = new Date(exam.exam_date);
    const diffDays = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7 && diffDays >= 0) {
      const title = `Upcoming Exam: ${exam.name}`;
      const message = `${exam.subject_name} exam is scheduled in ${diffDays === 0 ? 'today' : diffDays + ' days'} (${exam.exam_date}). Allocate revision time!`;
      
      // Avoid duplicate notification for same exam today
      const existing = db.prepare(`
        SELECT id FROM notifications 
        WHERE user_id = ? AND title = ? AND date(created_at) = date('now')
      `).get(userId, title);

      if (!existing) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, type, title, message, link)
          VALUES (?, ?, 'exam', ?, ?, '/exams')
        `).run(crypto.randomUUID(), userId, title, message);
      }
    }
  }

  // 2. Check overdue tasks
  const overdueTasks = db.prepare(`
    SELECT id, title, due_date 
    FROM tasks 
    WHERE user_id = ? AND status != 'Completed' AND due_date IS NOT NULL AND due_date < ?
  `).all(userId, todayStr);

  if (overdueTasks.length > 0) {
    const title = `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`;
    const message = `You have ${overdueTasks.length} pending task(s) past their deadline. Review your schedule to catch up.`;
    
    const existing = db.prepare(`
      SELECT id FROM notifications 
      WHERE user_id = ? AND title = ? AND date(created_at) = date('now')
    `).get(userId, title);

    if (!existing) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, message, link)
        VALUES (?, ?, 'task', ?, ?, '/tasks')
      `).run(crypto.randomUUID(), userId, title, message);
    }
  }

  // 3. Check low attendance (< target)
  const subjects = db.prepare(`
    SELECT id, name, target_percentage FROM subjects WHERE user_id = ?
  `).all(userId);

  for (const sub of subjects) {
    const total = db.prepare('SELECT count(*) as c FROM attendance_records WHERE user_id = ? AND subject_id = ?').get(userId, sub.id).c;
    const attended = db.prepare("SELECT count(*) as c FROM attendance_records WHERE user_id = ? AND subject_id = ? AND status = 'present'").get(userId, sub.id).c;
    
    if (total >= 3) {
      const pct = (attended / total) * 100;
      if (pct < sub.target_percentage) {
        const title = `Low Attendance Warning: ${sub.name}`;
        const message = `Your attendance in ${sub.name} is ${pct.toFixed(1)}%, which is below your target of ${sub.target_percentage}%. Attend upcoming classes to recover!`;
        
        const existing = db.prepare(`
          SELECT id FROM notifications 
          WHERE user_id = ? AND title = ? AND date(created_at) >= date('now', '-3 days')
        `).get(userId, title);

        if (!existing) {
          db.prepare(`
            INSERT INTO notifications (id, user_id, type, title, message, link)
            VALUES (?, ?, 'attendance', ?, ?, '/attendance')
          `).run(crypto.randomUUID(), userId, title, message);
        }
      }
    }
  }
}

module.exports = {
  syncUserNotifications
};

if (require.main === module) {
  console.log('[NotificationService] Service module loaded successfully.');
  console.log('[NotificationService] Note: This is a backend service module, not a standalone program.');
  console.log('[NotificationService] To launch the full application, run: cd server && npm start');
}
