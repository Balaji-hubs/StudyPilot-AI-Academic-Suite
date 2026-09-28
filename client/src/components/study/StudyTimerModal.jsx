import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Check, Sparkles, BookOpen, Clock } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';
import api from '../../services/api';

const STUDY_MODES = ['Focus', 'Revision', 'Practice', 'Reading', 'Assignment'];

export default function StudyTimerModal() {
  const {
    isOpen,
    setIsOpen,
    timerType,
    setTimerType,
    status,
    seconds,
    setSeconds,
    initialDuration,
    setInitialDuration,
    studyMode,
    setStudyMode,
    subjectId,
    setSubjectId,
    topicId,
    setTopicId,
    notes,
    setNotes,
    isBreak,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopAndSave,
    formattedTime
  } = useTimer();

  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Fetch subjects when modal opens
  useEffect(() => {
    if (isOpen) {
      api.get('/subjects').then(res => setSubjects(res.data)).catch(() => {});
    }
  }, [isOpen]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (subjectId) {
      api.get(`/topics?subjectId=${subjectId}`).then(res => setTopics(res.data)).catch(() => {});
    } else {
      setTopics([]);
    }
  }, [subjectId]);

  if (!isOpen) return null;

  // Calculate circular progress for Pomodoro
  const progressPct = timerType === 'pomodoro'
    ? Math.min(100, Math.max(0, ((initialDuration - seconds) / initialDuration) * 100))
    : 100;

  const handleCustomDuration = (minutes) => {
    const sec = minutes * 60;
    setSeconds(sec);
    setInitialDuration(sec);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Study & Focus Timer</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ color: 'var(--text-muted)', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle (Pomodoro vs Stopwatch) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => {
              if (status === 'idle') {
                setTimerType('pomodoro');
                setSeconds(25 * 60);
                setInitialDuration(25 * 60);
              }
            }}
            disabled={status !== 'idle'}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              background: timerType === 'pomodoro' ? 'var(--accent-primary)' : 'transparent',
              color: timerType === 'pomodoro' ? '#fff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
          >
            Pomodoro (25/5m)
          </button>
          <button
            onClick={() => {
              if (status === 'idle') {
                setTimerType('stopwatch');
                setSeconds(0);
              }
            }}
            disabled={status !== 'idle'}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              background: timerType === 'stopwatch' ? 'var(--accent-primary)' : 'transparent',
              color: timerType === 'stopwatch' ? '#fff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)'
            }}
          >
            Stopwatch
          </button>
        </div>

        {/* Timer Display with Glowing Ring */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 0',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '3.8rem',
            fontWeight: 800,
            fontFamily: 'monospace',
            letterSpacing: '2px',
            color: isBreak ? 'var(--success)' : 'var(--text-primary)',
            textShadow: status === 'running' ? '0 0 20px var(--accent-glow)' : 'none'
          }}>
            {formattedTime}
          </div>

          <div style={{ marginTop: '6px', fontSize: '0.85rem', fontWeight: 600, color: isBreak ? 'var(--success)' : 'var(--accent-primary)' }}>
            {isBreak ? '☕ Break Time — Relax & Recharge' : (status === 'running' ? '🔥 Focus Sprint Active' : 'Ready to study')}
          </div>

          {/* Quick preset buttons if Pomodoro & idle */}
          {timerType === 'pomodoro' && status === 'idle' && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              {[15, 25, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleCustomDuration(mins)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    background: initialDuration === mins * 60 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: initialDuration === mins * 60 ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '20px 0' }}>
          {status === 'idle' && (
            <button
              onClick={startTimer}
              className="btn btn-primary btn-lg"
              style={{ minWidth: '150px' }}
            >
              <Play size={20} /> Start Focus
            </button>
          )}

          {status === 'running' && (
            <button
              onClick={pauseTimer}
              className="btn btn-secondary btn-lg"
              style={{ minWidth: '130px' }}
            >
              <Pause size={20} /> Pause
            </button>
          )}

          {status === 'paused' && (
            <button
              onClick={resumeTimer}
              className="btn btn-primary btn-lg"
              style={{ minWidth: '130px' }}
            >
              <Play size={20} /> Resume
            </button>
          )}

          {status !== 'idle' && (
            <>
              <button
                onClick={resetTimer}
                className="btn btn-secondary"
                title="Reset timer"
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={stopAndSave}
                className="btn btn-primary"
                style={{ background: 'var(--success)' }}
                title="Finish and log session"
              >
                <Check size={18} /> Finish & Save
              </button>
            </>
          )}
        </div>

        {/* Session Metadata Controls */}
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Study Mode Pills */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '6px' }}>Study Mode</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {STUDY_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => setStudyMode(mode)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    background: studyMode === mode ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-tertiary)',
                    border: `1px solid ${studyMode === mode ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    color: studyMode === mode ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Subject & Topic Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Subject (Optional)</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '8px' }}
              >
                <option value="">No specific subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Topic (Optional)</label>
              <select
                value={topicId}
                onChange={e => setTopicId(e.target.value)}
                disabled={!subjectId}
                style={{ fontSize: '0.85rem', padding: '8px' }}
              >
                <option value="">All topics</option>
                {topics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Chapter 4 problem set, memorized key formulas"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
