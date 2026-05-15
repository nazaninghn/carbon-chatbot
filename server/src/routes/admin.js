const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const Knowledge = require('../models/Knowledge');
const User = require('../models/User');
const Session = require('../models/Session');
const embeddingService = require('../services/embeddingService');
const logger = require('../utils/logger');

const router = express.Router();

// All admin routes require admin role
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, sessionCount, knowledgeCount, activeSessionCount] = await Promise.all([
      User.countDocuments(),
      Session.countDocuments(),
      Knowledge.countDocuments({ isActive: true }),
      Session.countDocuments({ status: 'active' }),
    ]);

    res.json({
      users: userCount,
      sessions: sessionCount,
      knowledgeChunks: knowledgeCount,
      activeSessions: activeSessionCount,
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Add knowledge chunk
router.post('/knowledge', async (req, res) => {
  try {
    const { content, metadata } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const knowledge = await embeddingService.storeKnowledge(content, metadata || {});
    res.status(201).json({ knowledge: { _id: knowledge._id, metadata: knowledge.metadata } });
  } catch (error) {
    logger.error('Add knowledge error:', error);
    res.status(500).json({ error: 'Failed to add knowledge' });
  }
});

// Bulk add knowledge
router.post('/knowledge/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const results = [];
    for (const item of items) {
      try {
        const knowledge = await embeddingService.storeKnowledge(item.content, item.metadata);
        results.push({ success: true, id: knowledge._id });
      } catch (err) {
        results.push({ success: false, error: err.message });
      }
    }

    res.json({ results, total: items.length, success: results.filter(r => r.success).length });
  } catch (error) {
    logger.error('Bulk knowledge error:', error);
    res.status(500).json({ error: 'Failed to bulk add knowledge' });
  }
});

// Search knowledge
router.post('/knowledge/search', async (req, res) => {
  try {
    const { query, options } = req.body;
    const results = await embeddingService.search(query, options || {});
    res.json({ results });
  } catch (error) {
    logger.error('Knowledge search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// List all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Session.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// List all sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find()
      .select('title status currentPhase currentQuestion userId messages createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    // Add message count
    const result = sessions.map(s => ({ ...s, messages: s.messages?.length || 0 }));
    res.json({ sessions: result });
  } catch (error) {
    logger.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete session
router.delete('/sessions/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
