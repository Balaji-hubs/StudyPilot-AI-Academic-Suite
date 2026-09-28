import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import api from '../services/api';

const TimerContext = createContext();

// Simple Web Audio chime
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    // Audio context may be blocked before interaction
  }
}

export function TimerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [timerType, setTimerType] = useState('pomodoro'); // 'pomodoro' | 'stopwatch'
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'paused'
  const [seconds, setSeconds] = useState(25 * 60); // 25 min default
  const [initialDuration, setInitialDuration] = useState(25 * 60);
  const [studyMode, setStudyMode] = useState('Focus'); // Focus, Revision, Practice, Reading, Assignment
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [notes, setNotes] = useState('');
  const [isBreak, setIsBreak] = useState(false);

  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  // Main countdown/countup ticker
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          if (timerType === 'pomodoro') {
            if (prev <= 1) {
              clearInterval(intervalRef.current);
              handlePomodoroComplete();
              return 0;
            }
            return prev - 1;
          } else {
            // Stopwatch counts up
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [status, timerType, isBreak]);

  const handlePomodoroComplete = async () => {
    playChime();
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    setStatus('paused');

    if (!isBreak) {
      // Focus session just completed! Save it
      await saveSession(Math.round(initialDuration / 60));
      // Transition to break
      setIsBreak(true);
      setSeconds(5 * 60);
      setInitialDuration(5 * 60);
    } else {
      // Break just finished! Transition back to focus
      setIsBreak(false);
      setSeconds(25 * 60);
      setInitialDuration(25 * 60);
    }
  };

  const startTimer = () => {
    if (status === 'idle') {
      startTimeRef.current = new Date();
    }
    setStatus('running');
  };

  const pauseTimer = () => {
    setStatus('paused');
  };

  const resumeTimer = () => {
    setStatus('running');
  };

  const resetTimer = () => {
    setStatus('idle');
    clearInterval(intervalRef.current);
    if (timerType === 'pomodoro') {
      const duration = isBreak ? 5 * 60 : 25 * 60;
      setSeconds(duration);
      setInitialDuration(duration);
    } else {
      setSeconds(0);
    }
    startTimeRef.current = null;
  };

  const stopAndSave = async () => {
    const elapsedMinutes = timerType === 'pomodoro'
      ? Math.max(1, Math.round((initialDuration - seconds) / 60))
      : Math.max(1, Math.round(seconds / 60));

    setStatus('idle');
    clearInterval(intervalRef.current);

    if (elapsedMinutes >= 1 && !isBreak) {
      await saveSession(elapsedMinutes);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    resetTimer();
    setIsOpen(false);
  };

  const saveSession = async (durationMins) => {
    try {
      const now = new Date();
      const start = startTimeRef.current || new Date(now.getTime() - durationMins * 60000);
      await api.post('/study-sessions', {
        subjectId: subjectId || null,
        topicId: topicId || null,
        startTime: start.toISOString(),
        endTime: now.toISOString(),
        durationMinutes: durationMins,
        mode: studyMode,
        notes: notes || `Completed ${timerType} study session`,
        date: now.toISOString().slice(0, 10)
      });
    } catch (err) {
      console.error('Failed to log study session:', err);
    }
  };

  // Format seconds to mm:ss
  const formatTime = sec => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider
      value={{
        isOpen,
        setIsOpen,
        timerType,
        setTimerType,
        status,
        seconds,
        setSeconds,
        initialDuration,
        setInitialDuration,
        studyMode,
        setStudyMode,
        subjectId,
        setSubjectId,
        topicId,
        setTopicId,
        notes,
        setNotes,
        isBreak,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        stopAndSave,
        formattedTime: formatTime(seconds)
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  return useContext(TimerContext);
}
