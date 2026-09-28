const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const {
  generateStudyPlan,
  generateRecommendations,
  chatWithStudyPilot
} = require('../services/aiService');

router.use(authMiddleware);

// POST /api/ai/study-plan
// Generate a new AI plan (daily, weekly, or exam_prep)
router.post('/study-plan', async (req, res, next) => {
  try {
    const { planType = 'daily', targetDate, customNotes } = req.body;
    const plan = await generateStudyPlan({
      userId: req.userId,
      planType,
      targetDate,
      customNotes
    });
    res.json(plan);
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/study-plans
// Retrieve saved AI study plans
router.get('/study-plans', (req, res, next) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM ai_plans 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(req.userId);

    const parsed = plans.map(p => ({
      ...p,
      content: JSON.parse(p.content_json)
    }));

    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/ai/study-plans/:id/status
router.patch('/study-plans/:id/status', (req, res, next) => {
  try {
    const { status } = req.body;
    db.prepare(`
      UPDATE ai_plans 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(status || 'accepted', req.params.id, req.userId);

    res.json({ message: `Plan marked as ${status || 'accepted'}.` });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/recommendations
// Get personalized recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const recommendations = await generateRecommendations(req.userId);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
});

// POST /api/ai/chat
// Chat with StudyPilot AI
router.post('/chat', async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      // Find or create default session
      let session = db.prepare('SELECT id FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId);
      if (!session) {
        activeSessionId = crypto.randomUUID();
        db.prepare('INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)').run(activeSessionId, req.userId, 'Study Consultation');
      } else {
        activeSessionId = session.id;
      }
    }

    // Save user message
    const userMsgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO chat_messages (id, user_id, session_id, role, content)
      VALUES (?, ?, ?, 'user', ?)
    `).run(userMsgId, req.userId, activeSessionId, message.trim());

    // Fetch recent history
    const history = db.prepare(`
      SELECT role, content FROM chat_messages 
      WHERE user_id = ? AND session_id = ? 
      ORDER BY created_at ASC LIMIT 10
    `).all(req.userId, activeSessionId);

    // Generate AI response
    const assistantReply = await chatWithStudyPilot({
      userId: req.userId,
      message: message.trim(),
      history
    });

    // Save assistant message
    const botMsgId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO chat_messages (id, user_id, session_id, role, content)
      VALUES (?, ?, ?, 'assistant', ?)
    `).run(botMsgId, req.userId, activeSessionId, assistantReply);

    res.json({
      sessionId: activeSessionId,
      message: {
        id: botMsgId,
        role: 'assistant',
        content: assistantReply,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/ai/chat/history
router.get('/chat/history', (req, res, next) => {
  try {
    let session = db.prepare('SELECT id FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId);
    if (!session) {
      return res.json({ messages: [], sessionId: null });
    }

    const messages = db.prepare(`
      SELECT id, role, content, created_at as createdAt 
      FROM chat_messages 
      WHERE user_id = ? AND session_id = ? 
      ORDER BY created_at ASC
    `).all(req.userId, session.id);

    res.json({
      sessionId: session.id,
      messages
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/ai/chat/history
router.delete('/chat/history', (req, res, next) => {
  try {
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(req.userId);
    db.prepare('DELETE FROM chat_sessions WHERE user_id = ?').run(req.userId);
    res.json({ message: 'Chat history cleared successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
