import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, Clock, GraduationCap, UserCheck, Flame, 
  Sparkles, ArrowRight, Play, CheckCircle2, AlertTriangle, 
  Calendar, BookOpen, PlusCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { setIsOpen: setTimerOpen } = useTimer();

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [exams, setExams] = useState({ upcoming: [], all: [] });
  const [subjects, setSubjects] = useState([]);
  const [timetableToday, setTimetableToday] = useState([]);
  const [streak, setStreak] = useState({ currentStreak: 0, bestStreak: 0, isActiveToday: false });
  const [studySummary, setStudySummary] = useState({ todayHours: 0, totalHours: 0 });
  const [recommendations, setRecommendations] = useState([]);
  const [settings, setSettings] = useState({ daily_study_target_minutes: 180 });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const todayDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

      const [
        tasksRes,
        examsRes,
        subjectsRes,
        ttRes,
        streakRes,
        studyRes,
        recRes,
        settingsRes
      ] = await Promise.all([
        api.get('/tasks?view=all'),
        api.get('/exams'),
        api.get('/subjects'),
        api.get(`/timetable?day=${todayDayName}`),
        api.get('/streak'),
        api.get('/study-sessions/summary'),
        api.get('/ai/recommendations'),
        api.get('/settings')
      ]);

      setTasks(tasksRes.data);
      setExams(examsRes.data);
      setSubjects(subjectsRes.data);
      setTimetableToday(ttRes.data.entries || []);
      setStreak(streakRes.data);
      setStudySummary(studyRes.data);
      setRecommendations(recRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`);
      if (res.data.isCompleted) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      }
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: res.data.status, is_completed: res.data.isCompleted ? 1 : 0 } : t))
      );
      // Reload streak & summary if completed
      api.get('/streak').then(r => setStreak(r.data)).catch(() => {});
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading your personalized academic dashboard...</div>
      </div>
    );
  }

  // Calculated metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.due_date === todayStr || (!t.due_date && t.status !== 'Completed'));
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const taskCompletionPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const targetHours = (settings.daily_study_target_minutes || 180) / 60;
  const studyHoursToday = studySummary.todayHours || 0;
  const studyProgressPct = Math.min(100, Math.round((studyHoursToday / targetHours) * 100));

  // Overall attendance
  const subjectsWithAtt = subjects.filter(s => s.attendance?.totalClasses > 0);
  const overallAttendance = subjectsWithAtt.length > 0
    ? Math.round(subjectsWithAtt.reduce((acc, s) => acc + (s.attendance?.percentage || 0), 0) / subjectsWithAtt.length)
    : null;

  const topRecommendation = recommendations[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Welcome Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08))',
        border: '1px solid var(--border-highlight)',
        padding: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Overview
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome back, {user?.fullName || 'Student'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {profile?.college ? `${profile.college} — ${profile.course || ''} ${profile.branch || ''}` : 'Plan Smart. Study Better. Achieve More.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setTimerOpen(true)}
            className="btn btn-primary"
            style={{ padding: '10px 18px' }}
          >
            <Play size={16} /> Start Study Session
          </button>
          <Link to="/ai-planner" className="btn btn-secondary" style={{ padding: '10px 16px' }}>
            <Sparkles size={16} color="var(--accent-primary)" /> Generate AI Plan
          </Link>
        </div>
      </div>

      {/* Second Row: 6 Summary Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '16px'
      }}>
        {/* Today's Tasks */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Tasks</span>
            <CheckSquare size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {todayTasks.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {completedTasks.length} completed total
          </span>
        </div>

        {/* Study Hours */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Study Hours Today</span>
            <Clock size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {studyHoursToday}h
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Goal: {targetHours}h / day
          </span>
        </div>

        {/* Upcoming Exams */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upcoming Exams</span>
            <GraduationCap size={18} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {exams.upcoming.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {exams.upcoming[0] ? `Next in ${exams.upcoming[0].daysRemaining}d` : 'None pending'}
          </span>
        </div>

        {/* Attendance */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Attendance</span>
            <UserCheck size={18} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: overallAttendance !== null ? (overallAttendance < 75 ? 'var(--danger)' : 'var(--success)') : 'var(--text-primary)' }}>
            {overallAttendance !== null ? `${overallAttendance}%` : 'N/A'}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Target: {settings.attendance_target_pct || 75}%
          </span>
        </div>

        {/* Current Streak */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Current Streak</span>
            <Flame size={18} color="#f59e0b" fill={streak.currentStreak > 0 ? '#f59e0b' : 'none'} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
            {streak.currentStreak} {streak.currentStreak === 1 ? 'Day' : 'Days'}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Best: {streak.bestStreak} days
          </span>
        </div>

        {/* Total Subjects */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Subjects</span>
            <BookOpen size={18} color="var(--accent-secondary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {subjects.length}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Active courses
          </span>
        </div>
      </div>

      {/* Third Row: Today's Action Plan + Today's Timetable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Today's Tasks */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} color="var(--accent-primary)" /> Today's Action Plan
            </h3>
            <Link to="/tasks" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              View all ({tasks.length}) →
            </Link>
          </div>

          {todayTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 8px', opacity: 0.5, color: 'var(--success)' }} />
              <p style={{ fontSize: '0.9rem' }}>No pending tasks for today. You're completely caught up!</p>
              <Link to="/tasks" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
                <PlusCircle size={14} /> Add New Task
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: task.status === 'Completed' ? 'var(--bg-tertiary)' : 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    opacity: task.status === 'Completed' ? 0.65 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => handleToggleTask(task.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        textDecoration: task.status === 'Completed' ? 'line-through' : 'none',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {task.subject_name || 'General'} {task.due_date ? `• Due ${task.due_date}` : ''}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${
                    task.priority === 'Urgent' ? 'badge-danger' :
                    task.priority === 'High' ? 'badge-warning' :
                    task.priority === 'Medium' ? 'badge-info' : 'badge-neutral'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Timetable / Classes */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--accent-cyan)" /> Today's Timetable
            </h3>
            <Link to="/timetable" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Full Week →
            </Link>
          </div>

          {timetableToday.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <Calendar size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No classes or scheduled study slots today.</p>
              <Link to="/timetable" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
                <PlusCircle size={14} /> Add Schedule Slot
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {timetableToday.map(slot => (
                <div
                  key={slot.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    borderLeft: `4px solid ${slot.subject_color || 'var(--accent-primary)'}`,
                    border: '1px solid var(--border-color)',
                    borderLeftWidth: '4px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {slot.subject_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {slot.type} {slot.room ? `• Room ${slot.room}` : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {slot.start_time} - {slot.end_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fourth Row: Upcoming Exams Countdown + Progress Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Upcoming Exams Countdown Cards */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="var(--danger)" /> Upcoming Examinations
            </h3>
            <Link to="/exams" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Manage Exams →
            </Link>
          </div>

          {exams.upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <GraduationCap size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '0.9rem' }}>No exams scheduled yet.</p>
              <Link to="/exams" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
                <PlusCircle size={14} /> Schedule an Exam
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exams.upcoming.slice(0, 3).map(exam => (
                <div
                  key={exam.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${exam.daysRemaining <= 3 ? 'var(--danger)' : 'var(--warning)'}`
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {exam.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {exam.subject_name} ({exam.exam_type}) • {exam.exam_date}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '2px'
                  }}>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: exam.daysRemaining <= 3 ? 'var(--danger)' : 'var(--warning)'
                    }}>
                      {exam.daysRemaining === 0 ? 'TODAY!' : `${exam.daysRemaining} days left`}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {exam.exam_time || '09:00'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Analytics */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Academic Progress</h3>
            <Link to="/analytics" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
              Deep Analytics →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Task Completion Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Task Completion</span>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{taskCompletionPct}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${taskCompletionPct}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }} />
              </div>
            </div>

            {/* Daily Study Goal */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>Daily Study Target</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{studyHoursToday}h / {targetHours}h ({studyProgressPct}%)</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${studyProgressPct}%`, background: 'linear-gradient(90deg, var(--accent-cyan), var(--success))' }} />
              </div>
            </div>

            {/* Subject Breakdown preview */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                Subjects Registered ({subjects.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {subjects.slice(0, 5).map(sub => (
                  <span
                    key={sub.id}
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-tertiary)',
                      borderLeft: `3px solid ${sub.color}`
                    }}
                  >
                    {sub.name}
                  </span>
                ))}
                {subjects.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No subjects added yet. Add your curriculum in the Subjects tab.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Proactive AI Recommendation Card */}
      {topRecommendation && (
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08))',
          border: '1px solid var(--border-highlight)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  StudyPilot AI Recommendation: {topRecommendation.title}
                </span>
                <span className={`badge ${topRecommendation.priority === 'Urgent' ? 'badge-danger' : 'badge-info'}`}>
                  {topRecommendation.priority}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                {topRecommendation.message}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {topRecommendation.action_link && (
              <Link to={topRecommendation.action_link} className="btn btn-primary btn-sm">
                Take Action <ArrowRight size={14} />
              </Link>
            )}
            <Link to="/ai-assistant" className="btn btn-secondary btn-sm">
              Ask StudyPilot
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
