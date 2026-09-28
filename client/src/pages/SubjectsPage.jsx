import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Plus, Edit3, Trash2, Layers, Clock, 
  UserCheck, GraduationCap, X, CheckCircle2 
} from 'lucide-react';
import api from '../services/api';

const COLOR_PALETTES = [
  '#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', 
  '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [teacher, setTeacher] = useState('');
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      setSubjects(res.data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setName('');
    setCode('');
    setTeacher('');
    setTargetPercentage(75);
    setColor('#6366f1');
    setDescription('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code || '');
    setTeacher(sub.teacher || '');
    setTargetPercentage(sub.target_percentage || 75);
    setColor(sub.color || '#6366f1');
    setDescription(sub.description || '');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required.');
      return;
    }

    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject.id}`, {
          name: name.trim(),
          code: code.trim(),
          teacher: teacher.trim(),
          targetPercentage,
          color,
          description: description.trim()
        });
      } else {
        await api.post('/subjects', {
          name: name.trim(),
          code: code.trim(),
          teacher: teacher.trim(),
          targetPercentage,
          color,
          description: description.trim()
        });
      }
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save subject.');
    }
  };

  const handleDelete = async (id, subName) => {
    if (!window.confirm(`Delete "${subName}" and all associated topics?`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      setSubjects(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Subjects Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Configure your curriculum courses, syllabus progress, and faculty details
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Add New Subject
        </button>
      </div>

      {/* Grid of Subject Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading subjects...
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card empty-state">
          <BookOpen className="empty-state-icon" />
          <h3 className="empty-state-title">No subjects added yet</h3>
          <p className="empty-state-desc">
            Add your college or university subjects (e.g. DBMS, Data Structures, Calculus) to start organizing topics and study plans.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={16} /> Add Your First Subject
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {subjects.map(sub => (
            <div
              key={sub.id}
              className="glass-card interactive"
              style={{
                padding: '24px',
                borderTop: `5px solid ${sub.color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                {/* Title & Actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: sub.color, fontWeight: 700, textTransform: 'uppercase' }}>
                      {sub.code || 'COURSE'}
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
                      {sub.name}
                    </h2>
                    {sub.teacher && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Instructor: {sub.teacher}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleOpenEdit(sub)} style={{ color: 'var(--text-secondary)', padding: '4px' }}>
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(sub.id, sub.name)} style={{ color: 'var(--danger)', padding: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {sub.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                    {sub.description}
                  </p>
                )}

                {/* Topics Progress Bar */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Syllabus Topics</span>
                    <span style={{ fontWeight: 700 }}>
                      {sub.completedTopics} / {sub.totalTopics} completed ({sub.progressPercentage}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${sub.progressPercentage}%`, background: sub.color }} />
                  </div>
                </div>

                {/* Mini Stats Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '16px',
                  background: 'var(--bg-tertiary)',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} color="var(--accent-cyan)" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Study Hours</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{sub.studyHours}h</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={16} color={sub.attendance?.isLow ? 'var(--danger)' : 'var(--success)'} />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Attendance</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: sub.attendance?.isLow ? 'var(--danger)' : 'inherit' }}>
                        {sub.attendance?.percentage !== null ? `${sub.attendance?.percentage}%` : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Exam Badge if any */}
                {sub.upcomingExams?.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: 'var(--danger)',
                    fontWeight: 600
                  }}>
                    <GraduationCap size={15} />
                    <span>Exam: {sub.upcomingExams[0].name} ({sub.upcomingExams[0].exam_date})</span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Links */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <Link
                  to={`/topics?subjectId=${sub.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  <Layers size={14} /> Topics ({sub.totalTopics})
                </Link>
                <Link
                  to={`/tasks?subjectId=${sub.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  Tasks
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
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
                <label className="form-label" htmlFor="sub-name">Subject Name *</label>
                <input
                  id="sub-name"
                  type="text"
                  placeholder="e.g. Database Management Systems"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="sub-code">Course Code</label>
                  <input
                    id="sub-code"
                    type="text"
                    placeholder="e.g. CS-301"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="sub-teacher">Faculty / Instructor</label>
                  <input
                    id="sub-teacher"
                    type="text"
                    placeholder="e.g. Dr. Jennifer Davis"
                    value={teacher}
                    onChange={e => setTeacher(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="sub-target">Target Attendance (%)</label>
                  <input
                    id="sub-target"
                    type="number"
                    min="50"
                    max="100"
                    value={targetPercentage}
                    onChange={e => setTargetPercentage(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Subject Color Accent</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    {COLOR_PALETTES.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: 'var(--radius-full)',
                          background: c,
                          border: color === c ? '2px solid #fff' : 'none',
                          boxShadow: color === c ? '0 0 8px ' + c : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="sub-desc">Description / Syllabus Overview</label>
                <textarea
                  id="sub-desc"
                  rows={2}
                  placeholder="Key concepts, textbook references..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
