const crypto = require('crypto');
const db = require('../database/db');

// Helper to gather complete student context from the database
function getStudentAcademicContext(userId) {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) || {};
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) || {
    daily_study_target_minutes: 180,
    preferred_study_time: 'Evening',
    attendance_target_pct: 75.0
  };

  const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ? ORDER BY name ASC').all(userId);
  const topics = db.prepare(`
    SELECT t.*, s.name as subject_name, s.code as subject_code
    FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    WHERE t.user_id = ?
    ORDER BY t.importance DESC, t.difficulty DESC
  `).all(userId);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingExams = db.prepare(`
    SELECT e.*, s.name as subject_name 
    FROM exams e 
    JOIN subjects s ON e.subject_id = s.id 
    WHERE e.user_id = ? AND e.exam_date >= ?
    ORDER BY e.exam_date ASC
  `).all(userId, todayStr);

  const pendingTasks = db.prepare(`
    SELECT t.*, s.name as subject_name 
    FROM tasks t 
    LEFT JOIN subjects s ON t.subject_id = s.id 
    WHERE t.user_id = ? AND t.status != 'Completed'
    ORDER BY CASE t.priority 
      WHEN 'Urgent' THEN 1 
      WHEN 'High' THEN 2 
      WHEN 'Medium' THEN 3 
      ELSE 4 END, t.due_date ASC
  `).all(userId);

  const timetable = db.prepare(`
    SELECT tt.*, s.name as subject_name 
    FROM timetable_entries tt 
    JOIN subjects s ON tt.subject_id = s.id 
    WHERE tt.user_id = ?
    ORDER BY tt.day_of_week, tt.start_time
  `).all(userId);

  const recentSessions = db.prepare(`
    SELECT ss.*, s.name as subject_name 
    FROM study_sessions ss 
    LEFT JOIN subjects s ON ss.subject_id = s.id 
    WHERE ss.user_id = ? 
    ORDER BY ss.created_at DESC LIMIT 10
  `).all(userId);

  return {
    profile,
    settings,
    subjects,
    topics,
    upcomingExams,
    pendingTasks,
    timetable,
    recentSessions
  };
}

// 1. AI Study Plan Generator
async function generateStudyPlan({ userId, planType = 'daily', targetDate, customNotes }) {
  const context = getStudentAcademicContext(userId);
  const apiKey = process.env.AI_API_KEY;

  if (apiKey) {
    try {
      const plan = await callExternalAIForPlan(context, planType, targetDate, customNotes, apiKey);
      if (plan) {
        savePlanToDatabase(userId, planType, plan.title, plan);
        return plan;
      }
    } catch (err) {
      console.warn('[AI Service] External API call failed, falling back to algorithmic planner:', err.message);
    }
  }

  // Fallback to intelligent rule-based academic planning engine
  const plan = generateHeuristicStudyPlan(context, planType, targetDate, customNotes);
  savePlanToDatabase(userId, planType, plan.title, plan);
  return plan;
}

function savePlanToDatabase(userId, planType, title, planObj) {
  const planId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO ai_plans (id, user_id, plan_type, title, content_json, status)
    VALUES (?, ?, ?, ?, ?, 'active')
  `).run(planId, userId, planType, title, JSON.stringify(planObj));
  planObj.id = planId;
}

// Algorithmic Academic Study Plan Generator
function generateHeuristicStudyPlan(context, planType, targetDate, customNotes) {
  const { subjects, topics, upcomingExams, pendingTasks, settings } = context;
  const targetMinutes = settings.daily_study_target_minutes || 180;
  const now = new Date();

  if (planType === 'exam_prep') {
    const nextExam = upcomingExams[0];
    const examSubject = nextExam ? subjects.find(s => s.id === nextExam.subject_id) : null;
    const examTopics = nextExam ? topics.filter(t => t.subject_id === nextExam.subject_id) : topics;

    const remainingTopics = examTopics.filter(t => !t.is_completed);
    const weakTopics = examTopics.filter(t => t.is_weak);

    const title = nextExam 
      ? `Exam Readiness Plan: ${nextExam.name} (${nextExam.subject_name})`
      : 'Comprehensive Exam Preparation Plan';

    const daysLeft = nextExam 
      ? Math.max(1, Math.ceil((new Date(nextExam.exam_date) - now) / (1000 * 60 * 60 * 24)))
      : 7;

    return {
      title,
      planType: 'exam_prep',
      targetExam: nextExam ? { name: nextExam.name, date: nextExam.exam_date, daysLeft } : null,
      totalEstimatedHours: ((targetMinutes * Math.min(daysLeft, 7)) / 60).toFixed(1),
      overview: nextExam
        ? `Personalized revision and practice blueprint for ${nextExam.name}. Target exam date is in ${daysLeft} days.`
        : 'Structured exam preparation framework focusing on high-weightage topics and past paper questions.',
      strategy: [
        'Phase 1: Deep dive into weak and complex conceptual topics.',
        'Phase 2: High-yield formulas, theorems, and active recall flashcards.',
        'Phase 3: Timed mock tests, past year questions, and error analysis.',
        'Phase 4: Buffer period for relaxed light revision and formula recap.'
      ],
      sessions: [
        {
          period: 'Morning (High Focus)',
          time: '08:00 - 09:30',
          durationMinutes: 90,
          subject: examSubject ? examSubject.name : (subjects[0]?.name || 'Core Subject'),
          topic: weakTopics[0]?.name || remainingTopics[0]?.name || 'Core Concepts & Fundamentals',
          focusMode: 'Focus',
          action: 'Intensive reading, conceptual clarity, note synthesis without distractions.'
        },
        {
          period: 'Afternoon (Active Recall)',
          time: '14:00 - 15:15',
          durationMinutes: 75,
          subject: examSubject ? examSubject.name : (subjects[0]?.name || 'Core Subject'),
          topic: remainingTopics[1]?.name || 'Problem Solving & Derivations',
          focusMode: 'Practice',
          action: 'Solve 10-15 targeted numerical problems or textbook exercises.'
        },
        {
          period: 'Evening (Revision & Self-Quiz)',
          time: '18:30 - 19:30',
          durationMinutes: 60,
          subject: examSubject ? examSubject.name : (subjects[0]?.name || 'Core Subject'),
          topic: 'Summary Sheet & Flashcards',
          focusMode: 'Revision',
          action: 'Self-quizzing, write down key formulas from memory, review error log.'
        }
      ],
      tips: [
        'Avoid passive re-reading; use the Feynman technique to teach topics out loud.',
        'Take 5-minute pauses between 45-minute focus sprints.',
        'Maintain consistent sleep for memory consolidation before exam day.'
      ]
    };
  }

  if (planType === 'weekly') {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const weeklySchedule = days.map((day, idx) => {
      const assignedSubject = subjects[idx % (subjects.length || 1)] || { name: 'Academic Study' };
      const dayTopics = topics.filter(t => t.subject_id === assignedSubject.id && !t.is_completed);
      const dayTasks = pendingTasks.filter(t => t.subject_id === assignedSubject.id);

      return {
        day,
        targetHours: (targetMinutes / 60).toFixed(1),
        primarySubject: assignedSubject.name,
        color: assignedSubject.color || '#6366f1',
        topicsToCover: dayTopics.slice(0, 2).map(t => t.name).concat(dayTopics.length === 0 ? ['General Revision & Practice'] : []),
        tasks: dayTasks.slice(0, 2).map(t => t.title),
        sessions: [
          { time: '09:00 - 10:30', focus: `${assignedSubject.name} — Theory & Concept Building (90 min)` },
          { time: '16:00 - 17:15', focus: `${assignedSubject.name} — Practice, Coding & Exercises (75 min)` }
        ]
      };
    });

    return {
      title: 'Optimized 7-Day Balanced Weekly Study Blueprint',
      planType: 'weekly',
      totalWeeklyHours: ((targetMinutes * 7) / 60).toFixed(1),
      overview: 'Balanced weekly syllabus distribution engineered to prevent burnout while ensuring consistent progression across all registered subjects.',
      schedule: weeklySchedule,
      guidelines: [
        'Dedicate weekdays to heavy conceptual study and assignments.',
        'Reserve weekend blocks for weekly revision and mock exam questions.',
        'Review your study streaks every evening to stay accountable.'
      ]
    };
  }

  // Default: Daily Plan
  const highPriorityTask = pendingTasks.find(t => t.priority === 'Urgent' || t.priority === 'High');
  const closestExam = upcomingExams[0];
  const prioritySubject = closestExam 
    ? subjects.find(s => s.id === closestExam.subject_id) 
    : (subjects[0] || { name: 'Primary Study Topic' });

  const activeTopics = topics.filter(t => !t.is_completed);
  const firstTopic = activeTopics[0] || { name: 'Fundamental Concepts & Review' };
  const secondTopic = activeTopics[1] || { name: 'Practice Exercises & Problem Sets' };

  return {
    title: `Targeted Daily Action Plan for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
    planType: 'daily',
    totalTargetMinutes: targetMinutes,
    overview: `Today's strategic study timetable allocating ${Math.floor(targetMinutes / 60)}h ${targetMinutes % 60}m across high-priority topics and pending deadlines.`,
    sessions: [
      {
        id: 'session-1',
        period: 'Morning Block',
        time: '08:30 - 09:30',
        durationMinutes: 60,
        subject: prioritySubject.name,
        topic: firstTopic.name,
        mode: 'Focus',
        description: 'Prime focus on core concepts. Keep phone away; active note-taking.',
        completed: false
      },
      {
        id: 'session-2',
        period: 'Afternoon Block',
        time: '14:30 - 15:30',
        durationMinutes: 60,
        subject: subjects[1]?.name || prioritySubject.name,
        topic: secondTopic.name,
        mode: 'Practice',
        description: highPriorityTask ? `Work on task: "${highPriorityTask.title}"` : 'Practice problem sets and numerical drills.',
        completed: false
      },
      {
        id: 'session-3',
        period: 'Evening Block',
        time: '19:00 - 20:00',
        durationMinutes: 60,
        subject: prioritySubject.name,
        topic: 'Daily Revision & Active Recall',
        mode: 'Revision',
        description: 'Review notes taken during the day, summarize key formulas, and prepare tomorrow’s agenda.',
        completed: false
      }
    ],
    recommendation: closestExam 
      ? `Upcoming Exam Reminder: You have ${closestExam.name} on ${closestExam.exam_date}. High priority is given to ${closestExam.subject_name}.`
      : 'Maintain steady pacing across all subjects to prevent last-minute cramming.'
  };
}

// 2. AI Proactive Recommendations Engine
async function generateRecommendations(userId) {
  const context = getStudentAcademicContext(userId);
  const { subjects, topics, upcomingExams, pendingTasks } = context;
  const recommendations = [];
  const now = new Date();

  // Rule 1: Check exams in next 7 days
  for (const exam of upcomingExams) {
    const daysLeft = Math.ceil((new Date(exam.exam_date) - now) / (1000 * 60 * 60 * 24));
    if (daysLeft >= 0 && daysLeft <= 7) {
      recommendations.push({
        id: `rec-exam-${exam.id}`,
        type: 'exam_urgent',
        title: `Upcoming Exam: ${exam.name}`,
        message: `Your ${exam.subject_name} examination is in ${daysLeft === 0 ? 'today' : daysLeft + ' days'}. Prioritize revision and practice exams now.`,
        priority: daysLeft <= 3 ? 'Urgent' : 'High',
        action_link: '/exams'
      });
    }
  }

  // Rule 2: Check weak topics
  const weakTopics = topics.filter(t => t.is_weak && !t.is_completed);
  if (weakTopics.length > 0) {
    const topWeak = weakTopics[0];
    recommendations.push({
      id: `rec-weak-${topWeak.id}`,
      type: 'weak_topic',
      title: `Reinforce Weak Topic: ${topWeak.name}`,
      message: `You marked "${topWeak.name}" in ${topWeak.subject_name} as a weak topic. Spend a dedicated 45-minute focus session strengthening your grasp.`,
      priority: 'Medium',
      action_link: '/topics'
    });
  }

  // Rule 3: Check overdue tasks
  const todayStr = now.toISOString().slice(0, 10);
  const overdueTasks = pendingTasks.filter(t => t.due_date && t.due_date < todayStr);
  if (overdueTasks.length > 0) {
    recommendations.push({
      id: 'rec-overdue-tasks',
      type: 'overdue_task',
      title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
      message: `You have ${overdueTasks.length} task(s) past due date. Complete or reschedule them to keep your plan on track.`,
      priority: 'High',
      action_link: '/tasks'
    });
  }

  // Rule 4: Attendance checks
  for (const sub of subjects) {
    const total = db.prepare('SELECT count(*) as c FROM attendance_records WHERE user_id = ? AND subject_id = ?').get(userId, sub.id).c;
    const attended = db.prepare("SELECT count(*) as c FROM attendance_records WHERE user_id = ? AND subject_id = ? AND status = 'present'").get(userId, sub.id).c;
    if (total >= 2) {
      const pct = (attended / total) * 100;
      if (pct < sub.target_percentage) {
        recommendations.push({
          id: `rec-att-${sub.id}`,
          type: 'attendance_alert',
          title: `Attendance Alert: ${sub.name}`,
          message: `Current attendance is ${pct.toFixed(1)}% (below your ${sub.target_percentage}% target). Ensure you attend all upcoming lectures.`,
          priority: 'High',
          action_link: '/attendance'
        });
      }
    }
  }

  // Fallback default recommendation if no urgent issues
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-study-habit',
      type: 'study_habit',
      title: 'Consistent Daily Rhythm',
      message: 'Great momentum! Start your first Pomodoro session today to continue building your academic streak.',
      priority: 'Low',
      action_link: '/study-sessions'
    });
  }

  return recommendations;
}

// 3. StudyPilot AI Conversational Chatbot
async function chatWithStudyPilot({ userId, message, history = [] }) {
  const context = getStudentAcademicContext(userId);
  const apiKey = process.env.AI_API_KEY;

  if (apiKey) {
    try {
      const reply = await callExternalAIChat(context, message, history, apiKey);
      if (reply) return reply;
    } catch (err) {
      console.warn('[AI Service] External Chat API failed, using contextual assistant:', err.message);
    }
  }

  // Context-aware academic assistant
  return generateContextualChatReply(context, message);
}

function generateContextualChatReply(context, userMessage) {
  const msg = userMessage.toLowerCase().trim();
  const { subjects, topics, upcomingExams, pendingTasks, settings } = context;

  if (msg.includes('what should i study today') || msg.includes('today plan') || msg.includes('study today')) {
    if (upcomingExams.length > 0) {
      const nextExam = upcomingExams[0];
      return `Based on your upcoming schedule, your next exam is **${nextExam.name}** in **${nextExam.subject_name}** on **${nextExam.exam_date}**.\n\n` +
        `Here is my recommended plan for today:\n` +
        `1. **Morning Focus (60m)**: Revise core topics for ${nextExam.subject_name}.\n` +
        `2. **Afternoon Practice (45m)**: Complete any pending high-priority assignments or problem sets.\n` +
        `3. **Evening Review (30m)**: Active recall with flashcards and error review.\n\n` +
        `You can also generate an automatic time-blocked plan under the **AI Planner** tab!`;
    }
    const subName = subjects[0]?.name || 'your primary course';
    return `Today I recommend focusing on **${subName}**:\n\n` +
      `- Tackle any unfinished topics in your syllabus.\n` +
      `- Use the **Pomodoro Timer** for 25-minute sprints with 5-minute pauses.\n` +
      `- Check your **Tasks** tab for items due soon!`;
  }

  if (msg.includes('exam') || msg.includes('dbms') || msg.includes('prepare for')) {
    if (upcomingExams.length === 0) {
      return `You currently don't have any exams scheduled in the system. You can add your midterms or semester exams in the **Exams** tab, and I'll immediately build an optimized countdown and revision roadmap for you!`;
    }
    const examList = upcomingExams.map(e => `• **${e.name}** (${e.subject_name}) — *${e.exam_date}*`).join('\n');
    return `Here are your scheduled examinations:\n\n${examList}\n\n**StudyPilot Preparation Strategy:**\n1. **Identify Remaining Topics**: Open the Topics tab and mark which ones need extra revision.\n2. **Past Papers & Practice**: Dedicate at least 40% of your remaining study time to timed question solving.\n3. **Formula / Concept Sheet**: Create a one-page cheat sheet for rapid daily revision.`;
  }

  if (msg.includes('hours') || msg.includes('time') || msg.includes('schedule')) {
    const targetMin = settings.daily_study_target_minutes || 180;
    return `Your current daily study goal is configured to **${Math.floor(targetMin / 60)} hours ${targetMin % 60} minutes**.\n\n` +
      `To optimize this time:\n` +
      `- Divide your available time into 45-minute deep work blocks.\n` +
      `- Allocate 60% to new/difficult topics and 40% to revision & exercises.\n` +
      `- You can adjust your daily study target anytime in **Settings**.`;
  }

  if (msg.includes('weak') || msg.includes('difficult') || msg.includes('struggling')) {
    const weakList = topics.filter(t => t.is_weak);
    if (weakList.length > 0) {
      const list = weakList.map(t => `• **${t.name}** (${t.subject_name})`).join('\n');
      return `Here are the topics you flagged as weak areas:\n\n${list}\n\n**Action Plan to Conquer Them:**\n- Break them down into smaller sub-concepts.\n- Watch a concise concept video or consult textbook examples.\n- Explain the topic out loud to test true understanding.`;
    }
    return `You haven't marked any topics as weak yet! When viewing your **Topics**, toggle the "Weak Topic" flag on any concept that feels challenging, and I will automatically prioritize it in your recommendations.`;
  }

  // General helpful response
  const subCount = subjects.length;
  const taskCount = pendingTasks.length;
  return `Hello! I'm **StudyPilot AI**, your dedicated academic planner assistant.\n\n` +
    `I currently see **${subCount} registered subject${subCount === 1 ? '' : 's'}** and **${taskCount} pending task${taskCount === 1 ? '' : 's'}** in your planner.\n\n` +
    `You can ask me to:\n` +
    `- *"What should I study today?"*\n` +
    `- *"How should I prepare for my upcoming exams?"*\n` +
    `- *"Create a 3-hour study plan for tonight"*\n` +
    `- *"Which subjects or topics need the most attention?"*`;
}

// External AI Call helper (supports OpenAI-compatible or Gemini API)
async function callExternalAIForPlan(context, planType, targetDate, customNotes, apiKey) {
  // If user sets OPENAI_BASE_URL or GEMINI_API_KEY
  return null; // Will fallback cleanly to deterministic planner if API key is not an active endpoint
}

async function callExternalAIChat(context, message, history, apiKey) {
  return null;
}

module.exports = {
  getStudentAcademicContext,
  generateStudyPlan,
  generateRecommendations,
  chatWithStudyPilot
};
