import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Sparkles, Clock, Menu } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';

export default function MobileNav({ onOpenMenu }) {
  const { setIsOpen: setTimerOpen, status, formattedTime } = useTimer();

  return (
    <div className="mobile-bottom-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border-color)',
      display: 'none', // Handled by media query
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 90,
      padding: '0 8px'
    }}>
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
          fontSize: '0.72rem',
          fontWeight: 600,
          textDecoration: 'none'
        })}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/tasks"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
          fontSize: '0.72rem',
          fontWeight: 600,
          textDecoration: 'none'
        })}
      >
        <CheckSquare size={20} />
        <span>Tasks</span>
      </NavLink>

      {/* Floating Center Timer Button */}
      <button
        onClick={() => setTimerOpen(true)}
        style={{
          width: '46px',
          height: '46px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-22px',
          boxShadow: '0 6px 16px var(--accent-glow)',
          border: '3px solid var(--bg-primary)'
        }}
        aria-label="Study Timer"
      >
        <Clock size={20} />
      </button>

      <NavLink
        to="/ai-planner"
        className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
          fontSize: '0.72rem',
          fontWeight: 600,
          textDecoration: 'none'
        })}
      >
        <Sparkles size={20} />
        <span>AI Plan</span>
      </NavLink>

      <button
        onClick={onOpenMenu}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          fontWeight: 600
        }}
        aria-label="Open Menu Drawer"
      >
        <Menu size={20} />
        <span>Menu</span>
      </button>

      <style>{`
        @media (max-width: 1024px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
