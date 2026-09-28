import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, Clock, Calendar, GraduationCap, 
  UserCheck, BarChart3, Bot, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top Header */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)'
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
            fontWeight: 800,
            fontSize: '1.1rem'
          }}>
            🎓
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            AI Study Planner
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/about" style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            About
          </Link>
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Go to Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Get Started Free <ArrowRight size={15} />
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '80px 24px 60px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid var(--border-highlight)',
          color: 'var(--accent-primary)',
          fontSize: '0.88rem',
          fontWeight: 700,
          marginBottom: '24px'
        }}>
          <Sparkles size={16} /> Intelligent Student Academic Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          letterSpacing: '-1px',
          lineHeight: 1.15,
          marginBottom: '20px'
        }}>
          Plan Smart. Study Better.<br />
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Achieve More.
          </span>
        </h1>

        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '720px',
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          An intelligent study planner that helps college & university students organize tasks, exams, timetables, attendance, and study sessions with personalized AI-powered planning.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link to={isAuthenticated ? "/dashboard" : "/signup"} className="btn btn-primary btn-lg">
            {isAuthenticated ? 'Open Your Dashboard' : 'Get Started Free'} <ArrowRight size={18} />
          </Link>
          <Link to="/about" className="btn btn-secondary btn-lg">
            Learn More
          </Link>
        </div>

        {/* Feature Pills */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginTop: '48px',
          flexWrap: 'wrap',
          color: 'var(--text-muted)',
          fontSize: '0.9rem'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--success)" /> Zero Hardcoded Data
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--success)" /> Real Relational Database
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--success)" /> Privacy Guaranteed
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--success)" /> StudyPilot AI Assistant
          </span>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>
            Everything You Need to Excel Academically
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
            Designed specifically for student workflows. No generic to-do apps, no complex manual scheduling.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="glass-card interactive" style={{ padding: '28px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-md)',
                  background: feat.bg,
                  color: feat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{feat.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.88rem'
      }}>
        <div style={{ marginBottom: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          AI Study Planner — “Plan Smart. Study Better. Achieve More.”
        </div>
        <div>
          Full-Stack Academic Productivity Platform. © {new Date().getFullYear()} All rights reserved.
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: 'AI Study Planner',
    desc: 'Generates daily, weekly, and exam preparation schedules that factor in topic difficulties, exam deadlines, and your actual available hours.',
    icon: Sparkles,
    bg: 'rgba(99, 102, 241, 0.15)',
    color: '#6366f1'
  },
  {
    title: 'Exam Countdown & Prep',
    desc: 'Tracks semester, midterm, practical, and viva exams with real-time countdown days and priority badges to prevent last-minute cramming.',
    icon: GraduationCap,
    bg: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444'
  },
  {
    title: 'Task & Syllabus Manager',
    desc: 'Organize coursework by subject and topic with priority flags (Urgent to Low), estimated study times, and view overdue assignments instantly.',
    icon: CheckCircle2,
    bg: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981'
  },
  {
    title: 'Weekly & Daily Timetable',
    desc: 'Intuitive schedule grid from Monday to Sunday with built-in conflict detection so lectures and study sessions never overlap.',
    icon: Calendar,
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6'
  },
  {
    title: 'Attendance Safety Guard',
    desc: 'Monitors class attendance per subject and provides automatic warning alerts whenever your rate drops below your university target (e.g. 75%).',
    icon: UserCheck,
    bg: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b'
  },
  {
    title: 'Pomodoro & Study Sessions',
    desc: 'Built-in focus timer (25/5m) and stopwatch that automatically records your deep work sessions into your permanent database profile.',
    icon: Clock,
    bg: 'rgba(139, 92, 246, 0.15)',
    color: '#8b5cf6'
  },
  {
    title: 'StudyPilot AI Assistant',
    desc: 'Conversational academic assistant that knows your upcoming exams, weak topics, and study hours to answer questions and formulate strategies.',
    icon: Bot,
    bg: 'rgba(6, 182, 212, 0.15)',
    color: '#06b6d4'
  },
  {
    title: 'Deep Learning Analytics',
    desc: 'Rich charts showing weekly study trends, subject distributions, task completion velocity, and daily study streak counters.',
    icon: BarChart3,
    bg: 'rgba(236, 72, 153, 0.15)',
    color: '#ec4899'
  },
  {
    title: 'Privacy & Data Ownership',
    desc: 'Multi-tenant database isolation ensures your private records are strictly yours. Export your entire academic data as JSON or CSV anytime.',
    icon: ShieldCheck,
    bg: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e'
  }
];
