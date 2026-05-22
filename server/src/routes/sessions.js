const express = require('express');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const questionFlowService = require('../services/questionFlowService');
const logger = require('../utils/logger');

const router = express.Router();

// Validate :id param up-front so Mongoose never throws a CastError 500
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }
  next();
});

// Get all sessions for user (paginated)
router.get('/', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      Session.find({ userId: req.user._id })
        .select('title status currentPhase currentQuestion emissions createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ sessions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create new session
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const session = new Session({
      userId: req.user._id,
      title: title || `Carbon Report - ${new Date().toLocaleDateString('tr-TR')}`,
    });
    await session.save();

    res.status(201).json({ session });
  } catch (error) {
    logger.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get single session with messages (last 100 messages by default)
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findOne(
      { _id: req.params.id, userId: req.user._id },
      // Slice messages array to last 100 to avoid huge payloads for completed sessions
      { messages: { $slice: -100 }, reportData: 1, currentPhase: 1, currentQuestion: 1,
        title: 1, status: 1, emissions: 1, assumptions: 1, exclusions: 1, createdAt: 1, updatedAt: 1 }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Compute authoritative question number server-side so the client
    // doesn't have to count user messages (which is off-by-one when restored)
    const questionNumber = questionFlowService.getQuestionNumber(session.currentQuestion) || 1;

    res.json({ session, questionNumber });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted' });
  } catch (error) {
    logger.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Get session report data summary
router.get('/:id/summary', async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user._id,
    }).select('reportData emissions assumptions exclusions reportMeta');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const rd = session.reportData || {};
    // Derive reportMeta from reportData answers (question IDs → fields)
    const derived = {
      companyName:      rd.A1 || session.reportMeta?.companyName || '',
      vkn:              rd.A2 || session.reportMeta?.vkn || '',
      country:          rd.A3 || session.reportMeta?.country || '',
      city:             rd.A3_city || rd.A3_detail || session.reportMeta?.city || '',
      reportingYear:    rd.A4 || session.reportMeta?.reportingYear || '',
      preparer:         rd.A5 || session.reportMeta?.preparer || '',
      reportPurpose:    rd.A6 || session.reportMeta?.reportPurpose || '',
      sector:           rd.C1 || rd.B5 || session.reportMeta?.sector || '',
      boundaryApproach: rd.D1 || session.reportMeta?.boundaryApproach || '',
      efDatabase:       rd.D2 || session.reportMeta?.efDatabase || '',
      baselineYear:     rd.B2 || session.reportMeta?.baselineYear || '',
      scope3Approach:   rd.D3 || session.reportMeta?.scope3Approach || '',
    };

    res.json({
      reportMeta:       derived,
      reportData:       rd,
      emissions:        session.emissions,
      assumptions:      session.assumptions,
      exclusions:       session.exclusions,
      dataCompleteness: calculateCompleteness(rd),
    });
  } catch (error) {
    logger.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

function calculateCompleteness(reportData) {
  if (!reportData) return { percentage: 0, answeredQuestions: 0, totalQuestions: 133 };
  const answered = Object.keys(reportData).length;
  return {
    percentage:        Math.min(Math.round((answered / 133) * 100), 100),
    answeredQuestions: answered,
    totalQuestions:    133,
  };
}

module.exports = router;
