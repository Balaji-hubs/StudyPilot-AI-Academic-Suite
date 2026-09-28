import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Bot, CheckSquare, BookOpen,
  Layers, GraduationCap, Calendar, UserCheck, Clock,
  BarChart3, User, Settings, LogOut, X, BookMarked
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Planner', path: '/ai-planner', icon: Sparkles, badge: 'Smart' },
  { label: 'AI Assistant', path: '/ai-assistant', icon: Bot, badge: 'Pilot' },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Subjects', path: '/subjects', icon: BookOpen },
  { label: 'Topics', path: '/topics', icon: Layers },
  { label: 'Exams', path: '/exams', icon: GraduationCap },
  { label: 'Timetable', path: '/timetable', icon: Calendar },
  { label: 'Attendance', path: '/attendance', icon: UserCheck },
  { label: 'Study Sessions', path: '/study-sessions', icon: Clock },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 140
          }}
          className="mobile-backdrop"
        />
      )}

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`} style={{
        width: '260px',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 150,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform var(--transition-normal)'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px var(--accent-glow)'
            }}>
              <BookMarked size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                Study<span style={{ color: 'var(--accent-primary)' }}>Pilot</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Academic Suite
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="mobile-close-btn"
            style={{ color: 'var(--text-muted)', display: 'none' }}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth <= 1024) onClose();
                }}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'transparent',
                  boxShadow: isActive ? '0 4px 12px var(--accent-glow)' : 'none',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)'
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color="currentColor" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff'
                  }}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.82rem',
              flexShrink: 0
            }}>
              {user?.fullName?.charAt(0) || 'S'}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.fullName || 'Student'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Logged In
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              background: 'var(--danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 1024px) {
          .sidebar-container {
            transform: translateX(-100%);
          }
          .sidebar-container.open {
            transform: translateX(0);
          }
          .mobile-close-btn, .mobile-toggle-btn {
            display: flex !important;
          }
        }
        .sidebar-link:hover:not(.active) {
          background: var(--bg-tertiary) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </>
  );
}
