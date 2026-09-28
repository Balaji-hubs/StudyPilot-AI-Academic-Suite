import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Layers, Plus, Edit3, Trash2, CheckCircle2, Circle, 
  AlertTriangle, BookOpen, Clock, Search, X, Flag 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const IMPORTANCES = ['Low', 'Medium', 'High'];

export default function TopicsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSubject = searchParams.get('subjectId') || '';

  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [showWeakOnly, setShowWeakOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [importance, setImportance] = useState('Medium');
  const [isWeak, setIsWeak] = useState(false);
  const [notes, setNotes] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [error, setError] = useState('');

  const fetchTopics = async () => {
    try {
      setLoading(true);
      let url = '/topics?';
      if (selectedSubject) url += `subjectId=${selectedSubject}&`;
      if (showWeakOnly) url += 'isWeak=true&';
      const res = await api.get(url);
      setTopics(res.data);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [selectedSubject, showWeakOnly]);

  const handleOpenAdd = () => {
    setEditingTopic(null);
    setName('');
    setSubjectId(selectedSubject || (subjects[0]?.id || ''));
    setDifficulty('Medium');
    setImportance('Medium');
    setIsWeak(false);
    setNotes('');
    setEstimatedMinutes(60);
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTopic(t);
    setName(t.name);
    setSubjectId(t.subject_id);
    setDifficulty(t.difficulty);
    setImportance(t.importance);
    setIsWeak(Boolean(t.is_weak));
    setNotes(t.notes || '');
    setEstimatedMinutes(t.estimated_minutes || 60);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !subjectId) {
      setError('Topic name and subject are required.');
      return;
    }

    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, {
          name: name.trim(),
          subjectId,
          difficulty,
          importance,
          isWeak,
          notes,
          estimatedMinutes
        });
      } else {
        await api.post('/topics', {
          name: name.trim(),
          subjectId,
          difficulty,
          importance,
          isWeak,
          notes,
          estimatedMinutes
        });
      }
      setShowModal(false);
      fetchTopics();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save topic.');
    }
  };

  const handleToggleComplete = async (t) => {
    try {
      const res = await api.patch(`/topics/${t.id}/toggle-complete`);
      if (res.data.isCompleted) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      }
      setTopics(prev =>
        prev.map(item => (item.id === t.id ? { ...item, is_completed: res.data.isCompleted ? 1 : 0 } : item))
      );
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleToggleWeak = async (t) => {
    try {
      const res = await api.patch(`/topics/${t.id}/toggle-weak`);
      setTopics(prev =>
        prev.map(item => (item.id === t.id ? { ...item, is_weak: res.data.isWeak ? 1 : 0 } : item))
      );
    } catch (err) {
      console.error('Failed to toggle weak flag:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this syllabus topic?')) return;
    try {
      await api.delete(`/topics/${id}`);
      setTopics(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  // Filtered in memory for search
  const filteredTopics = topics.filter(t => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q));
  });

  const completedCount = topics.filter(t => t.is_completed).length;
  const weakCount = topics.filter(t => t.is_weak).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Topics & Syllabus Breakdown</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Break subjects down into granular concepts, track weak areas, and mark completion
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" disabled={subjects.length === 0}>
          <Plus size={18} /> Add New Topic
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <input
            type="text"
            placeholder="Search topics or concepts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        <select
          value={selectedSubject}
          onChange={e => {
            setSelectedSubject(e.target.value);
            setSearchParams(e.target.value ? { subjectId: e.target.value } : {});
          }}
          style={{ width: 'auto', minWidth: '180px' }}
        >
          <option value="">All Subjects ({subjects.length})</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowWeakOnly(prev => !prev)}
          className={`btn ${showWeakOnly ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <AlertTriangle size={15} color={showWeakOnly ? '#fff' : 'var(--warning)'} />
          Weak Topics ({weakCount})
        </button>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {completedCount} of {topics.length} topics finished
        </span>
      </div>

      {/* Topics List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading syllabus topics...
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="glass-card empty-state">
          <Layers className="empty-state-icon" />
          <h3 className="empty-state-title">No topics found</h3>
          <p className="empty-state-desc">
            {subjects.length === 0 
              ? 'Please add at least one subject first before creating topics.' 
              : 'Add key concepts, chapters, or syllabus modules to begin tracking your mastery!'}
          </p>
          {subjects.length > 0 && (
            <button onClick={handleOpenAdd} className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Plus size={16} /> Add Topic
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredTopics.map(t => {
            const isCompleted = Boolean(t.is_completed);
            const isWeak = Boolean(t.is_weak);

            return (
              <div
                key={t.id}
                className="glass-card interactive"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  opacity: isCompleted ? 0.75 : 1,
                  borderLeft: `4px solid ${t.subject_color || 'var(--accent-primary)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  <button
                    onClick={() => handleToggleComplete(t)}
                    style={{ color: isCompleted ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer' }}
                    title={isCompleted ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: 'var(--text-primary)'
                      }}>
                        {t.name}
                      </span>

                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)'
                      }}>
                        {t.subject_name}
                      </span>

                      {isWeak && (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          <AlertTriangle size={12} /> Weak Topic
                        </span>
                      )}
                    </div>

                    {t.notes && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {t.notes}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Difficulty: <strong>{t.difficulty}</strong></span>
                      <span>•</span>
                      <span>Importance: <strong>{t.importance}</strong></span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> ~{t.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleToggleWeak(t)}
                    className={`btn btn-sm ${isWeak ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ fontSize: '0.78rem', padding: '4px 8px' }}
                    title={isWeak ? 'Remove weak flag' : 'Mark as weak topic for AI attention'}
                  >
                    <Flag size={13} fill={isWeak ? 'currentColor' : 'none'} />
                    {isWeak ? 'Weak' : 'Mark Weak'}
                  </button>

                  <button onClick={() => handleOpenEdit(t)} style={{ color: 'var(--text-secondary)', padding: '6px' }}>
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} style={{ color: 'var(--danger)', padding: '6px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Topic Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingTopic ? 'Edit Topic' : 'Add New Topic'}
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
                <label className="form-label" htmlFor="topic-name">Topic Name *</label>
                <input
                  id="topic-name"
                  type="text"
                  placeholder="e.g. Normalization & BCNF"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="topic-sub">Subject *</label>
                <select
                  id="topic-sub"
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
                  <label className="form-label" htmlFor="topic-diff">Difficulty</label>
                  <select
                    id="topic-diff"
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                  >
                    {DIFFICULTIES.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="topic-imp">Exam Importance</label>
                  <select
                    id="topic-imp"
                    value={importance}
                    onChange={e => setImportance(e.target.value)}
                  >
                    {IMPORTANCES.map(i => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="topic-est">Estimated Study Time (min)</label>
                  <input
                    id="topic-est"
                    type="number"
                    min="10"
                    step="5"
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0, justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '22px' }}>
                    <input
                      type="checkbox"
                      checked={isWeak}
                      onChange={e => setIsWeak(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--warning)' }}
                    />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Mark as Weak Topic</span>
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="topic-notes">Notes & Key Formulas</label>
                <textarea
                  id="topic-notes"
                  rows={2}
                  placeholder="Key concepts, tips, or review points..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTopic ? 'Save Changes' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
