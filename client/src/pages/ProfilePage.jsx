import React, { useState, useEffect } from 'react';
import { 
  User, Mail, GraduationCap, Building, BookOpen, 
  Lock, CheckCircle2, AlertCircle, Save 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AVATARS = [
  '🎓', '🚀', '💡', '📚', '⚡', '🧠', '🌟', '💻', '🔬', '🏆'
];

export default function ProfilePage() {
  const { user, profile, refreshUserData } = useAuth();

  // Profile fields
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('🎓');
  const [college, setCollege] = useState('');
  const [course, setCourse] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
    }
    if (profile) {
      setAvatarUrl(profile.avatar_url || '🎓');
      setCollege(profile.college || '');
      setCourse(profile.course || '');
      setBranch(profile.branch || '');
      setYear(profile.year || '3rd Year');
      setSemester(profile.semester || '');
      setBio(profile.bio || '');
    }
  }, [user, profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMsg('');
      setProfileErr('');

      await api.put('/profile', {
        fullName,
        avatarUrl,
        college,
        course,
        branch,
        year,
        semester,
        bio
      });

      await refreshUserData();
      setProfileMsg('Profile information updated successfully!');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch (err) {
      setProfileErr(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPwErr('Current password and new password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setPwErr('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr('New passwords do not match.');
      return;
    }

    try {
      setSavingPw(true);
      setPwMsg('');
      setPwErr('');

      await api.put('/profile/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      setPwMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 4000);
    } catch (err) {
      setPwErr(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Student Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage your academic credentials, university department, and account security
        </p>
      </div>

      {/* Main Profile Info Form */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} color="var(--accent-primary)" /> Personal & Academic Details
        </h2>

        {profileMsg && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{profileMsg}</span>
          </div>
        )}
        {profileErr && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{profileErr}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Avatar Selector */}
          <div>
            <label className="form-label" style={{ marginBottom: '8px' }}>Profile Icon / Avatar</label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                fontSize: '1.6rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px var(--accent-glow)',
                marginRight: '8px'
              }}>
                {avatarUrl}
              </div>

              {AVATARS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarUrl(emoji)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-full)',
                    background: avatarUrl === emoji ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    fontSize: '1.2rem',
                    border: avatarUrl === emoji ? '2px solid #fff' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-name">Full Name</label>
              <input
                id="prof-name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address (Registered)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-coll">College / University</label>
              <input
                id="prof-coll"
                type="text"
                placeholder="e.g. Stanford University"
                value={college}
                onChange={e => setCollege(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-course">Course / Degree</label>
              <input
                id="prof-course"
                type="text"
                placeholder="e.g. B.Tech / B.S."
                value={course}
                onChange={e => setCourse(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-branch">Branch / Department</label>
              <input
                id="prof-branch"
                type="text"
                placeholder="e.g. Computer Science"
                value={branch}
                onChange={e => setBranch(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-year">Year of Study</label>
              <select
                id="prof-year"
                value={year}
                onChange={e => setYear(e.target.value)}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-sem">Current Semester</label>
              <input
                id="prof-sem"
                type="text"
                placeholder="e.g. Semester 5"
                value={semester}
                onChange={e => setSemester(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="prof-bio">Academic Bio / Focus Area</label>
              <input
                id="prof-bio"
                type="text"
                placeholder="e.g. AI systems, data engineering..."
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Change */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={20} color="var(--danger)" /> Security & Password Update
        </h2>

        {pwMsg && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{pwMsg}</span>
          </div>
        )}
        {pwErr && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{pwErr}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="cur-pw">Current Password *</label>
            <input
              id="cur-pw"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-prof-pw">New Password *</label>
              <input
                id="new-prof-pw"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="conf-prof-pw">Confirm New Password *</label>
              <input
                id="conf-prof-pw"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="btn btn-secondary" disabled={savingPw}>
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
