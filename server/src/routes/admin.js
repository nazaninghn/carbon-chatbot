const express = require('express');
const mongoose = require('mongoose');
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
const BULK_MAX = 200; // cap concurrent embedding API calls + DB writes
router.post('/knowledge/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    if (items.length > BULK_MAX) {
      return res.status(400).json({ error: `Maximum ${BULK_MAX} items per bulk request` });
    }

    const settled = await Promise.allSettled(
      items.map((item) => embeddingService.storeKnowledge(item.content, item.metadata))
    );
    const results = settled.map((r) =>
      r.status === 'fulfilled'
        ? { success: true, id: r.value._id }
        : { success: false, error: r.reason?.message }
    );

    res.json({ results, total: items.length, success: results.filter((r) => r.success).length });
  } catch (error) {
    logger.error('Bulk knowledge error:', error);
    res.status(500).json({ error: 'Failed to bulk add knowledge' });
  }
});

// Search knowledge
router.post('/knowledge/search', async (req, res) => {
  try {
    const { query, options } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'query is required and must be a non-empty string' });
    }
    // Whitelist known option fields to prevent passing arbitrary objects
    // to the embedding service (e.g. {limit: 100000} memory exhaustion).
    const safeOptions = {};
    if (typeof options?.limit  === 'number') safeOptions.limit    = Math.min(options.limit, 50);
    if (typeof options?.phase  === 'number') safeOptions.phase    = options.phase;
    if (typeof options?.minScore === 'number') safeOptions.minScore = options.minScore;
    const results = await embeddingService.search(query.trim(), safeOptions);
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ error: 'Admins cannot delete their own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    await Session.deleteMany({ userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// List all sessions
// Uses aggregation to return a message COUNT without loading the full
// messages array into Node.js memory (each session can have hundreds of
// large messages — loading all of them just to compute .length is an OOM risk).
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.aggregate([
      { $sort: { updatedAt: -1 } },
      { $project: {
        title:           1,
        status:          1,
        currentPhase:    1,
        currentQuestion: 1,
        userId:          1,
        createdAt:       1,
        updatedAt:       1,
        messages: { $size: { $ifNull: ['$messages', []] } },
      }},
    ]);
    res.json({ sessions });
  } catch (error) {
    logger.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete session
router.delete('/sessions/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
