import React, { useState, useEffect } from 'react';
import { 
  Clock, Play, Trash2, Calendar, BookOpen, 
  BarChart2, Filter, Sparkles, CheckCircle2 
} from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import api from '../services/api';

const STUDY_MODES = ['Focus', 'Revision', 'Practice', 'Reading', 'Assignment'];

export default function StudySessionsPage() {
  const { setIsOpen: setTimerOpen, status, formattedTime } = useTimer();

  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState({
    todayHours: 0,
    weeklyHours: 0,
    monthlyHours: 0,
    totalHours: 0,
    sessionCount: 0,
    subjectWise: [],
    modeWise: []
  });
  const [subjects, setSubjects] = useState([]);
  const [filterMode, setFilterMode] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      let url = '/study-sessions?';
      if (filterMode) url += `mode=${filterMode}&`;
      if (filterSubject) url += `subjectId=${filterSubject}&`;

      const [sessRes, sumRes] = await Promise.all([
        api.get(url),
        api.get('/study-sessions/summary')
      ]);

      setSessions(sessRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      console.error('Failed to load study sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
  }, [filterMode, filterSubject]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recorded study session?')) return;
    try {
      await api.delete(`/study-sessions/${id}`);
      fetchSessions();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Launcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Study Sessions & Focus Log</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Record deep work, Pomodoro sprints, and analyze subject study investments
          </p>
        </div>

        <button
          onClick={() => setTimerOpen(true)}
          className="btn btn-primary btn-lg"
          style={{ padding: '12px 24px' }}
        >
          <Play size={18} /> {status === 'running' ? `Timer Active (${formattedTime})` : 'Launch Focus Timer'}
        </button>
      </div>

      {/* 4 Summary Duration Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Study</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '4px' }}>
            {summary.todayHours}h
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {summary.todayMinutes || 0} minutes logged
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Past 7 Days (Weekly)</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {summary.weeklyHours}h
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Weekly pace
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Past 30 Days (Monthly)</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '4px' }}>
            {summary.monthlyHours}h
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Monthly aggregate
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>All-Time Sessions</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {summary.totalHours}h
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {summary.sessionCount || 0} completed sessions
          </span>
        </div>
      </div>

      {/* Subject-Wise Time Allocation Pills */}
      {summary.subjectWise?.length > 0 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="var(--accent-primary)" /> Subject Time Distribution
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {summary.subjectWise.map(s => (
              <div
                key={s.id}
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${s.color || 'var(--accent-primary)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.name}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {(s.minutes / 60).toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>
          <Filter size={16} /> Filters:
        </div>

        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={filterMode}
          onChange={e => setFilterMode(e.target.value)}
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="">All Study Modes</option>
          {STUDY_MODES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {sessions.length} sessions logged
        </span>
      </div>

      {/* Session History Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading session logs...
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card empty-state">
          <Clock className="empty-state-icon" />
          <h3 className="empty-state-title">No study sessions recorded yet</h3>
          <p className="empty-state-desc">
            Hit "Launch Focus Timer" above to begin your first Pomodoro sprint or free stopwatch session!
          </p>
          <button onClick={() => setTimerOpen(true)} className="btn btn-primary" style={{ marginTop: '8px' }}>
            <Play size={16} /> Start Studying Now
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Subject</th>
                  <th style={{ padding: '12px' }}>Topic</th>
                  <th style={{ padding: '12px' }}>Mode</th>
                  <th style={{ padding: '12px' }}>Duration</th>
                  <th style={{ padding: '12px' }}>Notes</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{s.date}</td>
                    <td style={{ padding: '12px' }}>
                      {s.subject_name ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-tertiary)',
                          borderLeft: `3px solid ${s.subject_color || 'var(--accent-primary)'}`
                        }}>
                          {s.subject_name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>General Focus</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                      {s.topic_name || '—'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                        {s.mode}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {s.duration_minutes} min ({ (s.duration_minutes / 60).toFixed(1) }h)
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.notes || '—'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{ color: 'var(--danger)', padding: '4px' }}
                        title="Delete log"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
