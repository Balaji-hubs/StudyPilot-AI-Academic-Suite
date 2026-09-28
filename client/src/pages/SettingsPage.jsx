import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, Moon, Sun, Bell, Clock, 
  Download, Trash2, CheckCircle2, AlertTriangle, Save 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SettingsPage() {
  const { theme, toggleTheme, isDark } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    theme: 'dark',
    enable_reminders: 1,
    exam_reminders: 1,
    task_reminders: 1,
    study_reminders: 1,
    daily_study_target_minutes: 180,
    preferred_study_time: 'Evening',
    pomodoro_focus_min: 25,
    pomodoro_short_break_min: 5,
    pomodoro_long_break_min: 15,
    attendance_target_pct: 75.0
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/settings');
        setSettings(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      setSuccessMsg('');
      await api.put('/settings', {
        theme,
        enableReminders: settings.enable_reminders,
        examReminders: settings.exam_reminders,
        taskReminders: settings.task_reminders,
        studyReminders: settings.study_reminders,
        dailyStudyTargetMinutes: settings.daily_study_target_minutes,
        preferredStudyTime: settings.preferred_study_time,
        pomodoroFocusMin: settings.pomodoro_focus_min,
        pomodoroShortBreakMin: settings.pomodoro_short_break_min,
        pomodoroLongBreakMin: settings.pomodoro_long_break_min,
        attendanceTargetPct: settings.attendance_target_pct
      });

      setSuccessMsg('Settings updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async (format) => {
    try {
      const response = await api.get(`/settings/export?format=${format}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      const blob = format === 'csv' 
        ? new Blob([response.data], { type: 'text/csv' }) 
        : new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_study_planner_backup_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    try {
      setDeleting(true);
      await api.delete('/settings/account');
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Application Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure theme preferences, study targets, notification triggers, and data backup
        </p>
      </div>

      {successMsg && (
        <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section 1: Appearance */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDark ? <Moon size={18} color="var(--accent-primary)" /> : <Sun size={18} color="var(--accent-primary)" />} Appearance & Theme
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Color Scheme</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Currently using <strong>{isDark ? 'Dark Theme' : 'Light Theme'}</strong>
            </div>
          </div>

          <button
            onClick={() => {
              toggleTheme();
              handleSaveSettings();
            }}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>Switch to {isDark ? 'Light' : 'Dark'} Mode</span>
          </button>
        </div>
      </div>

      {/* Section 2: Study Targets & Pomodoro */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--accent-cyan)" /> Study Habits & Pomodoro Intervals
        </h2>

        <div className="form-grid" style={{ marginBottom: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="daily-target">Daily Study Target (Hours)</label>
            <input
              id="daily-target"
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              value={((settings.daily_study_target_minutes || 180) / 60).toFixed(1)}
              onChange={e => setSettings(prev => ({ ...prev, daily_study_target_minutes: Math.round(Number(e.target.value) * 60) }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="pref-time">Preferred Focus Window</label>
            <select
              id="pref-time"
              value={settings.preferred_study_time || 'Evening'}
              onChange={e => setSettings(prev => ({ ...prev, preferred_study_time: e.target.value }))}
            >
              <option value="Morning">Early Morning (6 AM - 10 AM)</option>
              <option value="Afternoon">Afternoon (1 PM - 5 PM)</option>
              <option value="Evening">Evening (6 PM - 10 PM)</option>
              <option value="Night">Late Night (10 PM - 2 AM)</option>
            </select>
          </div>
        </div>

        <div className="form-grid" style={{ marginBottom: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="pom-focus">Pomodoro Focus (Minutes)</label>
            <input
              id="pom-focus"
              type="number"
              min="10"
              max="90"
              value={settings.pomodoro_focus_min || 25}
              onChange={e => setSettings(prev => ({ ...prev, pomodoro_focus_min: Number(e.target.value) }))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="pom-short">Short Break (Minutes)</label>
            <input
              id="pom-short"
              type="number"
              min="2"
              max="30"
              value={settings.pomodoro_short_break_min || 5}
              onChange={e => setSettings(prev => ({ ...prev, pomodoro_short_break_min: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="att-target">Attendance Safety Target (%)</label>
            <input
              id="att-target"
              type="number"
              min="50"
              max="100"
              value={settings.attendance_target_pct || 75}
              onChange={e => setSettings(prev => ({ ...prev, attendance_target_pct: Number(e.target.value) }))}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={handleSaveSettings} className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Section 3: Notification Preferences */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--warning)" /> Notification Reminders
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Exam Deadlines Reminders</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Notify when an exam is approaching within 7 days</div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.exam_reminders)}
              onChange={e => setSettings(prev => ({ ...prev, exam_reminders: e.target.checked ? 1 : 0 }))}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Task Due Date Warnings</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Alerts for tasks that are due today or overdue</div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.task_reminders)}
              onChange={e => setSettings(prev => ({ ...prev, task_reminders: e.target.checked ? 1 : 0 }))}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Study Streak Alerts</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remind me in the evening if daily study goal is not yet completed</div>
            </div>
            <input
              type="checkbox"
              checked={Boolean(settings.study_reminders)}
              onChange={e => setSettings(prev => ({ ...prev, study_reminders: e.target.checked ? 1 : 0 }))}
              style={{ width: '20px', height: '20px', accentColor: 'var(--accent-primary)' }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={handleSaveSettings} className="btn btn-primary" disabled={saving}>
            <Save size={16} /> Save Reminders
          </button>
        </div>
      </div>

      {/* Section 4: Data Export */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} color="var(--success)" /> Data Portability & Backup
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
          Export your complete planner records including subjects, syllabus topics, tasks, exams, attendance logs, and study sessions.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => handleExportData('json')} className="btn btn-secondary">
            <Download size={16} /> Export Full Backup (JSON)
          </button>
          <button onClick={() => handleExportData('csv')} className="btn btn-secondary">
            <Download size={16} /> Export Tasks (CSV)
          </button>
        </div>
      </div>

      {/* Section 5: Danger Zone */}
      <div className="glass-card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={18} /> Danger Zone
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
          Permanently delete your account and all associated curriculum, tasks, exams, and attendance history. This action cannot be undone.
        </p>

        <button
          onClick={() => {
            setDeleteConfirmation('');
            setShowDeleteModal(true);
          }}
          className="btn btn-danger"
        >
          <Trash2 size={16} /> Delete Account Permanently
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '24px', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)', marginBottom: '14px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Confirm Account Deletion</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              This will permanently erase your user profile, subjects, topics, tasks, timetable entries, study sessions, and attendance logs. Type <strong>DELETE</strong> below to proceed:
            </p>

            <input
              type="text"
              placeholder="Type DELETE"
              value={deleteConfirmation}
              onChange={e => setDeleteConfirmation(e.target.value)}
              style={{ marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || deleting}
                className="btn btn-danger"
              >
                {deleting ? 'Deleting...' : 'Erase Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
