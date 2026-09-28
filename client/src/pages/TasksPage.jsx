import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, Plus, Search, Filter, Edit3, Trash2, 
  Calendar, Clock, AlertCircle, CheckCircle2, X, BookOpen 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Pending', 'In Progress', 'Completed'];
const VIEWS = [
  { id: 'all', label: 'All Tasks' },
  { id: 'today', label: 'Due Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' }
];

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeView, setActiveView] = useState('all');
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formError, setFormError] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Pending');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = `/tasks?view=${activeView}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (filterSubject) url += `&subjectId=${filterSubject}`;
      if (filterPriority) url += `&priority=${filterPriority}`;
      if (sortBy) url += `&sortBy=${sortBy}`;

      const res = await api.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [activeView, filterSubject, filterPriority, sortBy]);

  // Load subjects once
  useEffect(() => {
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {});
  }, []);

  // When subject changes in modal, load its topics
  useEffect(() => {
    if (subjectId) {
      api.get(`/topics?subjectId=${subjectId}`).then(r => setTopics(r.data)).catch(() => {});
    } else {
      setTopics([]);
    }
  }, [subjectId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setSubjectId('');
    setTopicId('');
    setPriority('Medium');
    setStatus('Pending');
    setDueDate('');
    setEstimatedMinutes(45);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setSubjectId(task.subject_id || '');
    setTopicId(task.topic_id || '');
    setPriority(task.priority);
    setStatus(task.status);
    setDueDate(task.due_date || '');
    setEstimatedMinutes(task.estimated_minutes || 45);
    setFormError('');
    setShowModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title || !title.trim()) {
      setFormError('Task title is required.');
      return;
    }

    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, {
          title: title.trim(),
          description,
          subjectId: subjectId || null,
          topicId: topicId || null,
          priority,
          status,
          dueDate: dueDate || null,
          estimatedMinutes
        });
      } else {
        await api.post('/tasks', {
          title: title.trim(),
          description,
          subjectId: subjectId || null,
          topicId: topicId || null,
          priority,
          status,
          dueDate: dueDate || null,
          estimatedMinutes
        });
      }
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save task.');
    }
  };

  const handleToggleComplete = async (taskId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`);
      if (res.data.isCompleted) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      }
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: res.data.status, is_completed: res.data.isCompleted ? 1 : 0 } : t))
      );
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Task Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Track academic assignments, deadlines, and study goals
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Add New Task
        </button>
      </div>

      {/* Views Nav Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '8px',
        overflowX: 'auto'
      }}>
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: activeView === v.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: activeView === v.id ? '#fff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap'
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 240px', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
        </form>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="">Default Sort</option>
            <option value="priority">Priority First</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass-card empty-state">
          <CheckSquare className="empty-state-icon" />
          <h3 className="empty-state-title">No tasks found</h3>
          <p className="empty-state-desc">
            {activeView !== 'all' || search ? 'Try clearing your filters to see more tasks.' : 'Stay ahead of your academic coursework by adding your first task!'}
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={16} /> Create Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map(task => {
            const isCompleted = task.status === 'Completed';
            const isOverdue = task.due_date && task.due_date < new Date().toISOString().slice(0, 10) && !isCompleted;

            return (
              <div
                key={task.id}
                className="glass-card interactive"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  opacity: isCompleted ? 0.7 : 1,
                  borderLeft: isOverdue ? '4px solid var(--danger)' : `4px solid ${task.subject_color || 'var(--accent-primary)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={isCompleted}
                    onChange={() => handleToggleComplete(task.id)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
                    aria-label={`Mark ${task.title} complete`}
                  />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        color: 'var(--text-primary)'
                      }}>
                        {task.title}
                      </span>

                      {task.subject_name && (
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)'
                        }}>
                          {task.subject_name}
                        </span>
                      )}

                      {task.topic_name && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          / {task.topic_name}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {task.due_date && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: isOverdue ? 'var(--danger)' : 'inherit',
                          fontWeight: isOverdue ? 700 : 'normal'
                        }}>
                          <Calendar size={13} /> Due: {task.due_date} {isOverdue && '(Overdue!)'}
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> ~{task.estimated_minutes} min
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Badges & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span className={`badge ${
                    task.priority === 'Urgent' ? 'badge-danger' :
                    task.priority === 'High' ? 'badge-warning' :
                    task.priority === 'Medium' ? 'badge-info' : 'badge-neutral'
                  }`}>
                    {task.priority}
                  </span>

                  <span className={`badge ${
                    task.status === 'Completed' ? 'badge-success' :
                    task.status === 'In Progress' ? 'badge-info' : 'badge-neutral'
                  }`}>
                    {task.status}
                  </span>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(task)}
                      style={{ padding: '6px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)' }}
                      title="Edit task"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      style={{ padding: '6px', color: 'var(--danger)', borderRadius: 'var(--radius-sm)' }}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="task-title">Title *</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g. Complete DBMS Assignment 2"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="task-desc">Description (Optional)</label>
                <textarea
                  id="task-desc"
                  rows={2}
                  placeholder="Additional notes, requirements, or links..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-sub">Subject</label>
                  <select
                    id="task-sub"
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                  >
                    <option value="">No subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-top">Topic</label>
                  <select
                    id="task-top"
                    value={topicId}
                    onChange={e => setTopicId(e.target.value)}
                    disabled={!subjectId}
                  >
                    <option value="">No topic</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-pri">Priority</label>
                  <select
                    id="task-pri"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-stat">Status</label>
                  <select
                    id="task-stat"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-est">Est. Study Minutes</label>
                  <input
                    id="task-est"
                    type="number"
                    min="5"
                    step="5"
                    value={estimatedMinutes}
                    onChange={e => setEstimatedMinutes(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
