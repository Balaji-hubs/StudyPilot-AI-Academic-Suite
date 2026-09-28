import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Plus, Edit3, Trash2, Calendar, Clock, 
  AlertCircle, X, Sparkles, AlertTriangle 
} from 'lucide-react';
import api from '../services/api';

const EXAM_TYPES = ['Semester', 'Mid', 'Internal', 'Practical', 'Viva', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function ExamsPage() {
  const [examData, setExamData] = useState({ upcoming: [], past: [], all: [] });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:00');
  const [examType, setExamType] = useState('Semester');
  const [priority, setPriority] = useState('High');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exams');
      setExamData(res.data);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingExam(null);
    setName('');
    setSubjectId(subjects[0]?.id || '');
    setExamDate('');
    setExamTime('09:00');
    setExamType('Semester');
    setPriority('High');
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingExam(exam);
    setName(exam.name);
    setSubjectId(exam.subject_id);
    setExamDate(exam.exam_date);
    setExamTime(exam.exam_time || '09:00');
    setExamType(exam.exam_type || 'Semester');
    setPriority(exam.priority || 'High');
    setNotes(exam.notes || '');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subjectId || !examDate) {
      setError('Exam name, subject, and exam date are required.');
      return;
    }

    try {
      if (editingExam) {
        await api.put(`/exams/${editingExam.id}`, {
          name: name.trim(),
          subjectId,
          examDate,
          examTime,
          examType,
          priority,
          notes
        });
      } else {
        await api.post('/exams', {
          name: name.trim(),
          subjectId,
          examDate,
          examTime,
          examType,
          priority,
          notes
        });
      }
      setShowModal(false);
      fetchExams();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save exam.');
    }
  };

  const handleDelete = async (id, examName) => {
    if (!window.confirm(`Delete exam "${examName}"?`)) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams();
    } catch (err) {
      console.error('Failed to delete exam:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Exam Planner & Countdown</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Schedule academic tests, midterms, and semester examinations with countdown timers
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" disabled={subjects.length === 0}>
          <Plus size={18} /> Schedule New Exam
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading exams...
        </div>
      ) : examData.all.length === 0 ? (
        <div className="glass-card empty-state">
          <GraduationCap className="empty-state-icon" />
          <h3 className="empty-state-title">No exams scheduled yet</h3>
          <p className="empty-state-desc">
            {subjects.length === 0 
              ? 'Please add at least one subject first in the Subjects tab.' 
              : 'Add your upcoming tests, lab practicals, or semester finals to generate smart revision roadmaps!'}
          </p>
          {subjects.length > 0 && (
            <button onClick={handleOpenAdd} className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Plus size={16} /> Schedule Exam
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Upcoming Section */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> Upcoming Examinations ({examData.upcoming.length})
            </h2>

            {examData.upcoming.length === 0 ? (
              <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No upcoming exams scheduled. You have no pending test deadlines!
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px'
              }}>
                {examData.upcoming.map(exam => {
                  const isUrgent = exam.daysRemaining <= 3;
                  const isWarning = exam.daysRemaining <= 7 && !isUrgent;

                  return (
                    <div
                      key={exam.id}
                      className="glass-card interactive"
                      style={{
                        padding: '24px',
                        borderTop: isUrgent ? '5px solid var(--danger)' : `5px solid ${exam.subject_color || 'var(--accent-primary)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div>
                        {/* Countdown Badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: exam.subject_color || 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {exam.subject_name} • {exam.exam_type}
                          </span>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleOpenEdit(exam)} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
                              <Edit3 size={15} />
                            </button>
                            <button onClick={() => handleDelete(exam.id, exam.name)} style={{ color: 'var(--danger)', padding: '4px' }}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {exam.name}
                        </h3>

                        {exam.notes && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.4 }}>
                            {exam.notes}
                          </p>
                        )}
                      </div>

                      {/* Countdown Footer */}
                      <div style={{
                        background: isUrgent ? 'rgba(239, 68, 68, 0.12)' : (isWarning ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-tertiary)'),
                        border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          <Calendar size={14} />
                          <span>{exam.exam_date} at {exam.exam_time || '09:00'}</span>
                        </div>

                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          color: isUrgent ? 'var(--danger)' : (isWarning ? 'var(--warning)' : 'var(--accent-primary)')
                        }}>
                          {exam.daysRemaining === 0 ? 'TODAY!' : `${exam.daysRemaining} days left`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Exams Section if any */}
          {examData.past.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>
                Past Completed Exams ({examData.past.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {examData.past.map(exam => (
                  <div
                    key={exam.id}
                    className="glass-card"
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: 0.65
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{exam.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                        {exam.subject_name} • Conducted on {exam.exam_date}
                      </span>
                    </div>

                    <button onClick={() => handleDelete(exam.id, exam.name)} style={{ color: 'var(--danger)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Exam Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingExam ? 'Edit Exam' : 'Schedule Examination'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="exam-name">Exam Title *</label>
                <input
                  id="exam-name"
                  type="text"
                  placeholder="e.g. DBMS Semester Final Exam"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="exam-sub">Subject *</label>
                <select
                  id="exam-sub"
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="exam-date">Date *</label>
                  <input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="exam-time">Time</label>
                  <input
                    id="exam-time"
                    type="time"
                    value={examTime}
                    onChange={e => setExamTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="exam-type">Exam Category</label>
                  <select
                    id="exam-type"
                    value={examType}
                    onChange={e => setExamType(e.target.value)}
                  >
                    {EXAM_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="exam-priority">Priority</label>
                  <select
                    id="exam-priority"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="exam-notes">Syllabus Scope / Venue Notes</label>
                <textarea
                  id="exam-notes"
                  rows={2}
                  placeholder="Units 1 to 5, Hall 302, bring scientific calculator..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExam ? 'Save Changes' : 'Schedule Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
