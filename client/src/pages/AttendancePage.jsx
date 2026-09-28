import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Plus, Check, X, AlertTriangle, Calendar, 
  Trash2, BookOpen, ShieldAlert, Award 
} from 'lucide-react';
import api from '../services/api';

export default function AttendancePage() {
  const [data, setData] = useState({ summary: [], recentRecords: [], globalTarget: 75 });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal for manual date logging
  const [showModal, setShowModal] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  // Quick mark present or absent for today
  const handleQuickMark = async (subId, markStatus) => {
    try {
      await api.post('/attendance', {
        subjectId: subId,
        date: new Date().toISOString().slice(0, 10),
        status: markStatus,
        notes: `Quick mark ${markStatus}`
      });
      fetchAttendance();
    } catch (err) {
      console.error('Failed to quick mark attendance:', err);
    }
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!subjectId || !date || !status) {
      setError('Subject, date, and status are required.');
      return;
    }

    try {
      await api.post('/attendance', {
        subjectId,
        date,
        status,
        notes
      });
      setShowModal(false);
      setSubjectId('');
      setNotes('');
      fetchAttendance();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save attendance record.');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Delete this attendance entry?')) return;
    try {
      await api.delete(`/attendance/${recordId}`);
      fetchAttendance();
    } catch (err) {
      console.error('Failed to delete attendance record:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Attendance Tracker</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Monitor subject eligibility thresholds and avoid exam debarment warnings
          </p>
        </div>

        <button 
          onClick={() => {
            setSubjectId(subjects[0]?.id || '');
            setDate(new Date().toISOString().slice(0, 10));
            setStatus('present');
            setNotes('');
            setError('');
            setShowModal(true);
          }}
          className="btn btn-primary"
          disabled={subjects.length === 0}
        >
          <Plus size={18} /> Log Past Class
        </button>
      </div>

      {/* Global Academic Disclaimer Notice */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Award size={18} color="var(--accent-primary)" flexShrink={0} />
        <span>
          <strong>Academic Guideline:</strong> Attendance calculations are for personal planning purposes based on user records. Always verify official department records for exam eligibility.
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading attendance metrics...
        </div>
      ) : data.summary.length === 0 ? (
        <div className="glass-card empty-state">
          <UserCheck className="empty-state-icon" />
          <h3 className="empty-state-title">No subjects found</h3>
          <p className="empty-state-desc">
            Add your curriculum courses in the Subjects tab to start logging attendance.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Subject Attendance Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {data.summary.map(item => {
              const hasRecords = item.totalClasses > 0;
              const isDanger = item.isBelowTarget;
              const pct = item.percentage !== null ? item.percentage : 100;

              return (
                <div
                  key={item.subjectId}
                  className="glass-card interactive"
                  style={{
                    padding: '24px',
                    borderTop: `5px solid ${item.color || 'var(--accent-primary)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.color, textTransform: 'uppercase' }}>
                          {item.subjectCode || 'COURSE'}
                        </span>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
                          {item.subjectName}
                        </h2>
                      </div>

                      <div style={{
                        textAlign: 'right',
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: hasRecords 
                          ? (isDanger ? 'var(--danger)' : 'var(--success)') 
                          : 'var(--text-muted)'
                      }}>
                        {hasRecords ? `${item.percentage}%` : '—'}
                      </div>
                    </div>

                    {/* Warning if below threshold */}
                    {isDanger && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--danger-bg)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--danger)',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}>
                        <AlertTriangle size={16} flexShrink={0} />
                        <span>
                          Attendance is below your {item.targetPercentage}% target! Attend next {item.classesNeededForTarget} class(es) to recover.
                        </span>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          Attended: <strong>{item.attendedClasses}</strong> / Total: <strong>{item.totalClasses}</strong>
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>Target: {item.targetPercentage}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: isDanger ? 'var(--danger)' : 'var(--success)'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Mark Actions */}
                  <div style={{
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Today's Lecture:
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleQuickMark(item.subjectId, 'present')}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                        title="Mark Present Today"
                      >
                        <Check size={14} /> Present
                      </button>
                      <button
                        onClick={() => handleQuickMark(item.subjectId, 'absent')}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        title="Mark Absent Today"
                      >
                        <X size={14} /> Absent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Records Log Table */}
          {data.recentRecords?.length > 0 && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
                Recent Attendance Logs ({data.recentRecords.length})
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Subject</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Notes</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentRecords.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{r.date}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-tertiary)',
                            borderLeft: `3px solid ${r.subject_color || 'var(--accent-primary)'}`
                          }}>
                            {r.subject_name}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge ${r.status === 'present' ? 'badge-success' : 'badge-danger'}`}>
                            {r.status === 'present' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{r.notes || '—'}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteRecord(r.id)}
                            style={{ color: 'var(--danger)', padding: '4px' }}
                            title="Delete entry"
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
      )}

      {/* Manual Attendance Record Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Record Attendance Entry</h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSaveRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="att-sub">Subject *</label>
                <select
                  id="att-sub"
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
                  <label className="form-label" htmlFor="att-date">Date *</label>
                  <input
                    id="att-date"
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="att-status">Attendance Status *</label>
                  <select
                    id="att-status"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="present">Present (Attended)</option>
                    <option value="absent">Absent (Missed)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="att-notes">Notes (Optional)</label>
                <input
                  id="att-notes"
                  type="text"
                  placeholder="e.g. Guest lecture, lab session..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
