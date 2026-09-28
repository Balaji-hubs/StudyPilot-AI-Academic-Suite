import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, GraduationCap, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function OnboardingPage() {
  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('B.Tech / B.S.');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('3rd Year');
  const [semester, setSemester] = useState('5th Semester');
  const [dailyStudyHours, setDailyStudyHours] = useState('3.5');
  const [preferredStudyTime, setPreferredStudyTime] = useState('Evening');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    try {
      setLoading(true);
      await api.post('/settings/onboarding', {
        college,
        course,
        branch,
        year,
        semester,
        dailyStudyHours,
        preferredStudyTime
      });
      await refreshUserData();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save onboarding:', err);
      navigate('/dashboard'); // Allow continuing even on minor error
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    handleSubmit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 10%, rgba(99, 102, 241, 0.15) 0%, transparent 60%), var(--bg-primary)'
    }}>
      <div className="glass-card" style={{ maxWidth: '580px', width: '100%', padding: '40px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--accent-primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            <Sparkles size={16} /> Welcome Setup
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '8px' }}>
            Personalize Your Study Experience
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Tell StudyPilot a little about your university curriculum to generate tailored schedules.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Academic Info */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} color="var(--accent-primary)" /> Academic Details
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="onboard-college">College / University Name</label>
              <input
                id="onboard-college"
                type="text"
                placeholder="e.g. Stanford University / MIT / State Tech"
                value={college}
                onChange={e => setCollege(e.target.value)}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="onboard-course">Degree / Course</label>
                <input
                  id="onboard-course"
                  type="text"
                  placeholder="e.g. B.Tech, B.S., M.S."
                  value={course}
                  onChange={e => setCourse(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="onboard-branch">Department / Major</label>
                <input
                  id="onboard-branch"
                  type="text"
                  placeholder="e.g. Computer Science, Mechanical"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="onboard-year">Current Year</label>
                <select
                  id="onboard-year"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                >
                  <option value="1st Year">1st Year (Freshman)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="4th Year">4th Year (Senior)</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="onboard-sem">Current Semester</label>
                <input
                  id="onboard-sem"
                  type="text"
                  placeholder="e.g. Semester 5"
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Study Target */}
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--accent-primary)" /> Study Preferences
            </h3>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="onboard-hours">Target Daily Study Time (Hours)</label>
                <select
                  id="onboard-hours"
                  value={dailyStudyHours}
                  onChange={e => setDailyStudyHours(e.target.value)}
                >
                  <option value="1">1 Hour / Day</option>
                  <option value="2">2 Hours / Day</option>
                  <option value="3">3 Hours / Day</option>
                  <option value="3.5">3.5 Hours / Day (Recommended)</option>
                  <option value="4">4 Hours / Day</option>
                  <option value="5">5+ Hours / Day</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="onboard-time">Peak Focus Window</label>
                <select
                  id="onboard-time"
                  value={preferredStudyTime}
                  onChange={e => setPreferredStudyTime(e.target.value)}
                >
                  <option value="Morning">Early Morning (6 AM - 10 AM)</option>
                  <option value="Afternoon">Afternoon (1 PM - 5 PM)</option>
                  <option value="Evening">Evening (6 PM - 10 PM)</option>
                  <option value="Night">Late Night (10 PM - 2 AM)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleSkip}
              style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}
            >
              Skip for now
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? 'Setting up...' : 'Complete & Open Dashboard'} <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
