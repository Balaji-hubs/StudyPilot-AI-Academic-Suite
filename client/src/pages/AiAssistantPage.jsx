import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Trash2, Sparkles, User, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';

const SUGGESTED_PROMPTS = [
  "What should I study today?",
  "How should I prepare for my upcoming exams?",
  "I have 3 hours tonight. Create a study plan.",
  "Which subjects am I spending less time on?",
  "How can I conquer my weak topics?"
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadHistory() {
      try {
        setInitialLoading(true);
        const res = await api.get('/ai/chat/history');
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
          setSessionId(res.data.sessionId);
        } else {
          // Welcome default greeting
          setMessages([
            {
              id: 'welcome-msg',
              role: 'assistant',
              content: "👋 Hello! I'm **StudyPilot AI**, your dedicated academic advisor.\n\nI have access to your registered subjects, upcoming exams, weak topics, and study logs. How can I help you excel today?"
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const tempUserMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: text,
        sessionId
      });

      setSessionId(res.data.sessionId);
      setMessages(prev => [...prev, res.data.message]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue processing your query. Please try again or rephrase your question.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear conversation history?')) return;
    try {
      await api.delete('/ai/chat/history');
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: "Chat cleared! How can **StudyPilot AI** help you plan your studies today?"
        }
      ]);
      setSessionId(null);
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  // Basic markdown formatter for paragraphs and bullet points
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold replacer
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return <li key={idx} style={{ marginLeft: '16px' }}>{formattedLine}</li>;
      }
      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) {
        return <div key={idx} style={{ marginTop: '4px' }}>{formattedLine}</div>;
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '8px' }} />;
      }
      return <p key={idx} style={{ margin: '4px 0' }}>{formattedLine}</p>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '520px', gap: '16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--accent-glow)'
          }}>
            <Bot size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              StudyPilot AI Assistant
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Context-aware academic advisor & study strategy coach
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Trash2 size={14} /> Clear Chat
        </button>
      </div>

      {/* Suggested Prompts Pill Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)'
            }}
            className="interactive"
          >
            <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', color: 'var(--accent-primary)' }} />
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="glass-card" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {initialLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Connecting to StudyPilot AI...
          </div>
        ) : (
          messages.map(m => {
            const isBot = m.role === 'assistant';

            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  justifyContent: isBot ? 'flex-start' : 'flex-end'
                }}
              >
                {isBot && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={18} />
                  </div>
                )}

                <div style={{
                  maxWidth: '78%',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-lg)',
                  background: isBot ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  color: isBot ? 'var(--text-primary)' : '#fff',
                  border: isBot ? '1px solid var(--border-color)' : 'none',
                  fontSize: '0.92rem',
                  lineHeight: 1.5,
                  boxShadow: isBot ? 'none' : '0 4px 14px var(--accent-glow)'
                }}>
                  {renderFormattedContent(m.content)}
                </div>

                {!isBot && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={16} />
                  </div>
                )}
              </div>
            );
          })
        )}

        {loading && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={18} />
            </div>
            <div style={{
              padding: '10px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              fontSize: '0.88rem'
            }}>
              StudyPilot is thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder="Ask StudyPilot about your tasks, exams, weak topics, or revision strategy..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '14px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.95rem'
          }}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn btn-primary"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Send Message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
