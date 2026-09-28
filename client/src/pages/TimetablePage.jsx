import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Edit3, Trash2, Clock, MapPin, 
  AlertTriangle, X, CheckCircle2 
} from 'lucide-react';
import api from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ENTRY_TYPES = ['Class', 'Study', 'Revision', 'Assignment', 'Break', 'Other'];

export default function TimetablePage() {
  const [weekly, setWeekly] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [activeDay, setActiveDay] = useState(() => {
    const dayIndex = new Date().getDay(); // 0 is Sunday
    return dayIndex === 0 ? 'Sunday' : DAYS[dayIndex - 1];
  });
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [room, setRoom] = useState('');
  const [type, setType] = useState('Class');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetable');
      setWeekly(res.data.weekly || {});
    } catch (err) {
      console.error('Failed to load timetable:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  // When subject changes in modal, load topics
  useEffect(() => {
    if (subjectId) {
      api.get(`/topics?subjectId=${subjectId}`).then(r => setTopics(r.data)).catch(() => {});
    } else {
      setTopics([]);
    }
  }, [subjectId]);

  const handleOpenAdd = (dayPreset = null) => {
    setEditingEntry(null);
    setSubjectId(subjects[0]?.id || '');
    setTopicId('');
    setDayOfWeek(dayPreset || activeDay);
    setStartTime('09:00');
    setEndTime('10:00');
    setRoom('');
    setType('Class');
    setNotes('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (slot) => {
    setEditingEntry(slot);
    setSubjectId(slot.subject_id);
    setTopicId(slot.topic_id || '');
    setDayOfWeek(slot.day_of_week);
    setStartTime(slot.start_time);
    setEndTime(slot.end_time);
    setRoom(slot.room || '');
    setType(slot.type);
    setNotes(slot.notes || '');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!subjectId || !dayOfWeek || !startTime || !endTime) {
      setError('Subject, day, start and end times are required.');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be strictly before end time.');
      return;
    }

    try {
      if (editingEntry) {
        await api.put(`/timetable/${editingEntry.id}`, {
          subjectId,
          topicId: topicId || null,
          dayOfWeek,
          startTime,
          endTime,
          room,
          type,
          notes
        });
      } else {
        await api.post('/timetable', {
          subjectId,
          topicId: topicId || null,
          dayOfWeek,
          startTime,
          endTime,
          room,
          type,
          notes
        });
      }
      setShowModal(false);
      fetchTimetable();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save timetable slot.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this timetable slot?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      fetchTimetable();
    } catch (err) {
      console.error('Failed to delete timetable entry:', err);
    }
  };

  const currentDaySlots = weekly[activeDay] || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Weekly Academic Timetable</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Plan lectures, lab sessions, and study time with intelligent conflict detection
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            padding: '3px'
          }}>
            <button
              onClick={() => setViewMode('day')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: viewMode === 'day' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'day' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode('week')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: viewMode === 'week' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'week' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Weekly Grid
            </button>
          </div>

          <button onClick={() => handleOpenAdd()} className="btn btn-primary" disabled={subjects.length === 0}>
            <Plus size={18} /> Add Schedule Slot
          </button>
        </div>
      </div>

      {/* Day Selector Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {DAYS.map(day => {
          const slotCount = (weekly[day] || []).length;
          const isToday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()] === day;

          return (
            <button
              key={day}
              onClick={() => {
                setActiveDay(day);
                if (viewMode === 'week') setViewMode('day');
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: activeDay === day && viewMode === 'day' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: activeDay === day && viewMode === 'day' ? '#fff' : 'var(--text-secondary)',
                border: isToday ? '1px solid var(--accent-primary)' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{day}</span>
              {slotCount > 0 && (
                <span style={{
                  fontSize: '0.72rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: activeDay === day && viewMode === 'day' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-card)',
                  color: activeDay === day && viewMode === 'day' ? '#fff' : 'var(--text-muted)'
                }}>
                  {slotCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading timetable...
        </div>
      ) : viewMode === 'day' ? (
        /* Daily View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {activeDay} Schedule ({currentDaySlots.length} slots)
            </h2>
            <button onClick={() => handleOpenAdd(activeDay)} className="btn btn-secondary btn-sm">
              <Plus size={14} /> Add to {activeDay}
            </button>
          </div>

          {currentDaySlots.length === 0 ? (
            <div className="glass-card empty-state">
              <Calendar className="empty-state-icon" />
              <h3 className="empty-state-title">No slots scheduled for {activeDay}</h3>
              <p className="empty-state-desc">
                Keep your day organized by adding your classes, labs, and dedicated study time blocks.
              </p>
              <button onClick={() => handleOpenAdd(activeDay)} className="btn btn-primary" style={{ marginTop: '8px' }}>
                <Plus size={16} /> Add Slot
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentDaySlots.map(slot => (
                <div
                  key={slot.id}
                  className="glass-card interactive"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: `5px solid ${slot.subject_color || 'var(--accent-primary)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      minWidth: '100px',
                      background: 'var(--bg-tertiary)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--accent-primary)'
                    }}>
                      {slot.start_time} - {slot.end_time}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {slot.subject_name}
                        </span>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                          {slot.type}
                        </span>
                        {slot.room && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <MapPin size={13} /> {slot.room}
                          </span>
                        )}
                      </div>

                      {slot.topic_name && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Topic: <strong>{slot.topic_name}</strong>
                        </div>
                      )}

                      {slot.notes && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {slot.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleOpenEdit(slot)} style={{ color: 'var(--text-secondary)', padding: '6px' }}>
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(slot.id)} style={{ color: 'var(--danger)', padding: '6px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Weekly Grid View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          alignItems: 'start'
        }}>
          {DAYS.map(day => {
            const slots = weekly[day] || [];
            return (
              <div
                key={day}
                className="glass-card"
                style={{ padding: '16px', minHeight: '320px', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{day}</span>
                  <button onClick={() => handleOpenAdd(day)} style={{ color: 'var(--accent-primary)', padding: '2px' }}>
                    <Plus size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {slots.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', marginTop: '30px' }}>
                      No entries
                    </div>
                  ) : (
                    slots.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleOpenEdit(s)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: `3px solid ${s.subject_color || 'var(--accent-primary)'}`,
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.subject_name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          {s.start_time} - {s.end_time} ({s.type})
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Timetable Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingEntry ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={18} flexShrink={0} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tt-sub">Subject *</label>
                  <select
                    id="tt-sub"
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

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tt-day">Day of Week *</label>
                  <select
                    id="tt-day"
                    value={dayOfWeek}
                    onChange={e => setDayOfWeek(e.target.value)}
                  >
                    {DAYS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tt-start">Start Time *</label>
                  <input
                    id="tt-start"
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tt-end">End Time *</label>
                  <input
                    id="tt-end"
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tt-type">Slot Category</label>
                  <select
                    id="tt-type"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    {ENTRY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="tt-room">Room / Location</label>
                  <input
                    id="tt-room"
                    type="text"
                    placeholder="e.g. Hall 204 / Library"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="tt-notes">Notes / Preparation</label>
                <input
                  id="tt-notes"
                  type="text"
                  placeholder="Bring lab notebook, submit assignment..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEntry ? 'Save Changes' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
