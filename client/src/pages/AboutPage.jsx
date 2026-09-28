import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, Shield, Cpu, Target, ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>
          About AI Study Planner
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
          “Plan Smart. Study Better. Achieve More.” — An intelligent full-stack academic productivity platform designed for college and university students worldwide.
        </p>

        {/* Section 1: The Problem */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Target size={24} color="var(--danger)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>The Academic Problem</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            College students routinely juggle 5 to 8 challenging subjects simultaneously, each with distinct topic difficulties, assignment deadlines, lecture timetables, and strict attendance thresholds. Most generic to-do apps lack academic context — they don't understand exam countdowns, syllabus completion ratios, or how many classes you must attend to maintain 75% eligibility. Students end up overwhelmed, cramming before exams, and struggling to pace their study habits.
          </p>
        </div>

        {/* Section 2: The Solution */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Sparkles size={24} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Our Solution</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
            AI Study Planner unifies all dimensions of student life into a single intelligent engine:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <li><strong>Relational Academic Data:</strong> Connects subjects directly to topics, tasks, exams, attendance logs, and study sessions.</li>
            <li><strong>Personalized AI Planner:</strong> Synthesizes your real syllabus data and upcoming exam dates to create realistic, time-blocked daily and weekly schedules.</li>
            <li><strong>StudyPilot AI:</strong> A dedicated conversational advisor with context over your actual academic workload.</li>
            <li><strong>Habit & Streak Engineering:</strong> Daily streak tracking and interactive Pomodoro focus sessions make studying consistent and rewarding.</li>
          </ul>
        </div>

        {/* Section 3: AI Safety & Data Ethics */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Shield size={24} color="var(--success)" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>AI Transparency & Academic Ethics</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Our AI architecture is built on strict data boundaries:
            <br /><br />
            1. <strong>No Fabricated Data:</strong> The AI never invents fake exam dates, mock assignments, or fictitious attendance numbers. It relies strictly on your recorded academic schedule.<br />
            2. <strong>Strict Data Isolation:</strong> Every student's records are completely isolated at the database level by user ID. User A can never view User B's subjects, tasks, or study logs.<br />
            3. <strong>Data Portability:</strong> You own your data. You can export your full academic records to JSON or CSV at any time in Settings.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Create Your Account Today
          </Link>
        </div>
      </div>
    </div>
  );
}
