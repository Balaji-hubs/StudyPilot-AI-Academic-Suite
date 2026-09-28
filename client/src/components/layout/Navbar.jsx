import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sun, Moon, Bell, Flame, Play, Pause, Check, Trash2, 
  User, LogOut, Settings as SettingsIcon, Menu, X, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTimer } from '../../context/TimerContext';
import { useNotifications } from '../../context/NotificationContext';
import api from '../../services/api';

export default function Navbar({ onToggleSidebar }) {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { status, formattedTime, setIsOpen: setTimerOpen, isBreak } = useTimer();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const [streak, setStreak] = useState({ currentStreak: 0, isActiveToday: false });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Fetch streak
  useEffect(() => {
    async function loadStreak() {
      try {
        const res = await api.get('/streak');
        setStreak(res.data);
      } catch (e) {
        // silent
      }
    }
    loadStreak();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="navbar-container" style={{
      height: '68px',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left: Mobile Toggle & Page Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onToggleSidebar}
          className="mobile-toggle-btn"
          style={{ 
            color: 'var(--text-primary)',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            display: 'none'
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-greeting" style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome, {user?.fullName?.split(' ')[0] || 'Student'} 👋
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Streak Counter Pill */}
        <Link 
          to="/analytics"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: streak.isActiveToday ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-tertiary)',
            color: streak.isActiveToday ? '#f59e0b' : 'var(--text-muted)',
            border: `1px solid ${streak.isActiveToday ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'}`,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.86rem',
            fontWeight: 700,
            textDecoration: 'none'
          }}
          title={`Daily Study Streak: ${streak.currentStreak} day(s)`}
        >
          <Flame size={16} fill={streak.currentStreak > 0 ? '#f59e0b' : 'none'} color={streak.currentStreak > 0 ? '#f59e0b' : 'currentColor'} />
          <span>{streak.currentStreak} {streak.currentStreak === 1 ? 'day' : 'days'}</span>
        </Link>

        {/* Global Study Timer Launcher Button */}
        <button
          onClick={() => setTimerOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: status === 'running' 
              ? (isBreak ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))')
              : 'var(--bg-tertiary)',
            border: status === 'running' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
            color: status === 'running' ? 'var(--accent-primary)' : 'var(--text-primary)',
            fontWeight: 600,
            fontSize: '0.88rem'
          }}
          className={status === 'running' ? 'animate-glow' : ''}
        >
          {status === 'running' ? <Pause size={15} /> : <Play size={15} />}
          <span>{status === 'running' ? formattedTime : 'Study Timer'}</span>
          {isBreak && <span style={{ fontSize: '0.72rem', color: 'var(--success)' }}>Break</span>}
        </button>

        {/* Notification Bell with Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            onClick={() => setShowNotifications(prev => !prev)}
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: 'var(--danger)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Tray */}
          {showNotifications && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              width: '360px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '16px',
              zIndex: 200,
              animation: 'slideUp 0.2s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications yet. You're all caught up!
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        background: n.is_read ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: n.is_read ? 'var(--text-primary)' : 'var(--accent-primary)' }}>
                          {n.title}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!n.is_read && (
                            <button onClick={() => markAsRead(n.id)} title="Mark read" style={{ color: 'var(--text-muted)' }}>
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => deleteNotification(n.id)} title="Delete" style={{ color: 'var(--text-muted)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {n.message}
                      </p>
                      {n.link && (
                        <Link 
                          to={n.link} 
                          onClick={() => { markAsRead(n.id); setShowNotifications(false); }}
                          style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', color: 'var(--accent-primary)' }}
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)'
          }}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Avatar Menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }} className="user-name-label">
              {user?.fullName?.split(' ')[0] || 'Profile'}
            </span>
          </button>

          {showUserMenu && (
            <div style={{
              position: 'absolute',
              top: '46px',
              right: 0,
              width: '200px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              padding: '8px',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              animation: 'slideUp 0.15s ease-out'
            }}>
              <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.fullName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
              </div>

              <Link
                to="/profile"
                onClick={() => setShowUserMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none'
                }}
              >
                <User size={15} /> My Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none'
                }}
              >
                <SettingsIcon size={15} /> Settings
              </Link>

              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  fontSize: '0.85rem',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  width: '100%'
                }}
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
