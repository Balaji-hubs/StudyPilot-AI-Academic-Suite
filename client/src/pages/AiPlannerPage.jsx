import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RotateCcw, Check, Calendar, Clock, 
  GraduationCap, BookOpen, AlertCircle, CheckCircle2 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';

const PLAN_TYPES = [
  { id: 'daily', label: 'Daily Action Plan', desc: 'Optimized time-blocks for today' },
  { id: 'weekly', label: '7-Day Weekly Schedule', desc: 'Balanced syllabus pacing' },
  { id: 'exam_prep', label: 'Exam Readiness Roadmap', desc: 'High-yield revision for upcoming tests' }
];

export default function AiPlannerPage() {
  const [selectedType, setSelectedType] = useState('daily');
  const [customNotes, setCustomNotes] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  const fetchSavedPlans = async () => {
    try {
      const res = await api.get('/ai/study-plans');
      setSavedPlans(res.data);
    } catch (err) {
      console.error('Failed to load saved plans:', err);
    }
  };

  useEffect(() => {
    fetchSavedPlans();
    // Auto generate daily plan on initial visit if empty
    handleGeneratePlan('daily');
  }, []);

  const handleGeneratePlan = async (type = selectedType) => {
    try {
      setGenerating(true);
      setAcceptedSuccess(false);
      const res = await api.post('/ai/study-plan', {
        planType: type,
        customNotes
      });
      setCurrentPlan(res.data);
      fetchSavedPlans();
    } catch (err) {
      console.error('Failed to generate plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAcceptPlan = async () => {
    if (!currentPlan?.id) return;
    try {
      setAccepting(true);
      await api.patch(`/ai/study-plans/${currentPlan.id}/status`, { status: 'accepted' });
      setAcceptedSuccess(true);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      fetchSavedPlans();
    } catch (err) {
      console.error('Failed to accept plan:', err);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
            <Sparkles size={16} /> Intelligent Academic Engine
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>AI Personalized Study Planner</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Synthesizes your syllabus, upcoming exam countdowns, weak topics, and daily hours into actionable schedules
          </p>
        </div>

        <button
          onClick={() => handleGeneratePlan()}
          disabled={generating}
          className="btn btn-primary btn-lg"
        >
          <RotateCcw size={18} className={generating ? 'animate-spin' : ''} />
          {generating ? 'Synthesizing Plan...' : 'Regenerate Plan'}
        </button>
      </div>

      {/* Plan Type Selector Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px'
      }}>
        {PLAN_TYPES.map(type => {
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                handleGeneratePlan(type.id);
              }}
              className="glass-card interactive"
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {type.label}
                </span>
                {isSelected && <CheckCircle2 size={18} color="var(--accent-primary)" />}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                {type.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Generated Plan Display */}
      {generating ? (
        <div className="glass-card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Sparkles size={36} color="var(--accent-primary)" className="animate-spin" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
            Analyzing Your Academic Profile...
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
            Evaluating pending tasks, calculating exam countdowns, prioritizing weak syllabus topics, and allocating non-conflicting study blocks.
          </p>
        </div>
      ) : currentPlan ? (
        <div className="glass-card" style={{ padding: '28px' }}>
          {/* Plan Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div>
              <span className="badge badge-info" style={{ textTransform: 'uppercase', marginBottom: '6px' }}>
                {currentPlan.planType || selectedType} plan
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {currentPlan.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '6px' }}>
                {currentPlan.overview}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAcceptPlan}
                disabled={accepting || acceptedSuccess}
                className="btn btn-primary"
                style={{ background: acceptedSuccess ? 'var(--success)' : undefined }}
              >
                <Check size={18} /> {acceptedSuccess ? 'Plan Saved & Active!' : 'Accept & Save Plan'}
              </button>
            </div>
          </div>

          {/* Daily Sessions View */}
          {currentPlan.sessions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--accent-primary)" /> Scheduled Time Blocks
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                {currentPlan.sessions.map((sess, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                          {sess.period}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                          {sess.mode || sess.focusMode || 'Focus'}
                        </span>
                      </div>

                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                        {sess.subject}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                        Topic: {sess.topic}
                      </div>

                      {sess.description && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                          {sess.description}
                        </p>
                      )}
                      {sess.action && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                          {sess.action}
                        </p>
                      )}
                    </div>

                    <div style={{
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span>{sess.time}</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{sess.durationMinutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Schedule View */}
          {currentPlan.schedule && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>7-Day Syllabus Distribution</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                {currentPlan.schedule.map((dayItem, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      borderLeft: `4px solid ${dayItem.color || 'var(--accent-primary)'}`,
                      border: '1px solid var(--border-color)',
                      borderLeftWidth: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{dayItem.day}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dayItem.targetHours}h target</span>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '8px' }}>
                      Primary: {dayItem.primarySubject}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>Topics:</strong> {dayItem.topicsToCover.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Prep Strategy Pillars */}
          {currentPlan.strategy && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={18} color="var(--danger)" /> Strategic Exam Preparation Pillars
              </h3>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.7 }}>
                {currentPlan.strategy.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Saved Plans History */}
      {savedPlans.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px' }}>
            Saved Plan History ({savedPlans.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {savedPlans.map(plan => (
              <div
                key={plan.id}
                onClick={() => setCurrentPlan(plan.content)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{plan.title}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                    Created: {new Date(plan.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className={`badge ${plan.status === 'accepted' ? 'badge-success' : 'badge-neutral'}`}>
                  {plan.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
