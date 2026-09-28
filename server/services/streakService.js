const db = require('../database/db');

function calculateUserStreak(userId) {
  // Get all unique dates from study_sessions and completed tasks
  const sessionDates = db.prepare(`
    SELECT DISTINCT date FROM study_sessions WHERE user_id = ?
  `).all(userId).map(r => r.date);

  const taskDates = db.prepare(`
    SELECT DISTINCT substr(completed_at, 1, 10) as date 
    FROM tasks 
    WHERE user_id = ? AND is_completed = 1 AND completed_at IS NOT NULL
  `).all(userId).map(r => r.date);

  // Combine and sort unique dates descending
  const dateSet = new Set([...sessionDates, ...taskDates].filter(Boolean));
  const uniqueDates = Array.from(dateSet).sort().reverse(); // e.g. ['2026-09-23', '2026-09-22', ...]

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
      isActiveToday: false
    };
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const isActiveToday = uniqueDates.includes(todayStr);

  // Calculate current streak
  let currentStreak = 0;
  // If active today, start checking from today; if not active today but active yesterday, start from yesterday
  let checkDate = new Date();
  if (!isActiveToday) {
    if (uniqueDates.includes(yesterdayStr)) {
      checkDate = yesterdayDate;
    } else {
      currentStreak = 0;
    }
  }

  if (isActiveToday || uniqueDates.includes(yesterdayStr)) {
    let tempDate = new Date(checkDate);
    while (true) {
      const formatted = tempDate.toISOString().slice(0, 10);
      if (dateSet.has(formatted)) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate best streak across all history
  // Sort dates ascending
  const ascDates = Array.from(dateSet).sort();
  let bestStreak = 0;
  let tempStreak = 0;
  let previousDate = null;

  for (const dateStr of ascDates) {
    const cur = new Date(dateStr);
    if (!previousDate) {
      tempStreak = 1;
    } else {
      const diffMs = cur.getTime() - previousDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    previousDate = cur;
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  }

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    totalActiveDays: uniqueDates.length,
    lastActiveDate: uniqueDates[0] || null,
    isActiveToday
  };
}

module.exports = {
  calculateUserStreak
};

if (require.main === module) {
  console.log('[StreakService] Service module loaded successfully.');
  console.log('[StreakService] Note: This is an internal backend service, not a standalone program.');
  console.log('[StreakService] To launch the full application, run: cd server && npm start');
}
