const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const ragService = require('../services/ragService');
const questionFlowService = require('../services/questionFlowService');
const logger = require('../utils/logger');

const router = express.Router();

// ── POST /api/chat/message ────────────────────────────────────────────────
router.post('/message', [
  body('message').trim().isLength({ min: 1, max: 5000 }),
  body('sessionId').isMongoId(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, sessionId, lang = 'tr' } = req.body;
    const userId = req.user._id;

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Resolve numeric/text selection to option value
    const resolved = questionFlowService.resolveAnswer(
      session.currentQuestion,
      message,
      lang
    );

    session.messages.push({
      role: 'user',
      content: message,
      metadata: { questionId: session.currentQuestion, phase: session.currentPhase },
    });

    const sessionContext = {
      currentPhase: session.currentPhase,
      currentQuestion: session.currentQuestion,
      reportData: session.reportData,
      lang,
    };

    const response = await ragService.processMessage(
      message,
      sessionContext,
      session.messages.slice(-10)
    );

    const isValid = response.metadata?.action === 'next' ||
                    response.metadata?.validationStatus === 'valid';
    const isPrev  = response.metadata?.action === 'prev';

    // ── Extract ONLY the confirmation part from the LLM response ───────────
    // The LLM sometimes writes the next question after [NEXT_QUESTION] (or even
    // without the token). Slicing at the token keeps only the ✅ confirmation.
    // The server always appends the authoritative next question from the DB below,
    // so we must never let LLM-generated question text bleed into finalContent.
    const nextTokIdx = response.content.indexOf('[NEXT_QUESTION]');
    let finalContent = (nextTokIdx !== -1
      ? response.content.slice(0, nextTokIdx)           // keep only pre-token text
      : response.content.replace(/\[PREV_QUESTION\]/g, '')
    ).trim();

    // Fallback: strip any hallucinated question block the LLM appended without
    // the token (detected by the formatted "*Aşama N · Soru N/133*" header).
    finalContent = finalContent.replace(
      /\n+\*?(?:Aşama \d+|Phase \d+)\s*[·•]\s*(?:Soru|Question)\s*\d+\/\d+\*?[\s\S]*/,
      ''
    ).trim();

    // Store answer and advance question
    if (isValid) {
      session.reportData[session.currentQuestion] = resolved.resolved || message;
      session.markModified('reportData'); // Mixed type requires explicit dirty-marking

      const nextQuestion = questionFlowService.getNextQuestion(
        session.currentQuestion,
        session.reportData
      );

      if (nextQuestion) {
        session.currentQuestion = nextQuestion;
        const nextDef = questionFlowService.getQuestion(nextQuestion);
        if (nextDef) session.currentPhase = nextDef.phase;

        // Append the next question text
        const nextQMsg = questionFlowService.formatQuestionMessage(nextQuestion, lang);
        if (nextQMsg) {
          finalContent = finalContent ? `${finalContent}\n\n---\n\n${nextQMsg}` : nextQMsg;
        }
      }
    }

    // Handle "back"
    if (isPrev) {
      const allIds = Object.keys(require('../data/questions').QUESTIONS);
      const currentIdx = allIds.indexOf(session.currentQuestion);
      if (currentIdx > 0) {
        session.currentQuestion = allIds[currentIdx - 1];
        const prevDef = questionFlowService.getQuestion(session.currentQuestion);
        if (prevDef) session.currentPhase = prevDef.phase;
        const prevQMsg = questionFlowService.formatQuestionMessage(session.currentQuestion, lang);
        if (prevQMsg) finalContent = prevQMsg;
      }
    }

    session.messages.push({
      role: 'assistant',
      content: finalContent,
      metadata: {
        questionId: session.currentQuestion,
        phase: session.currentPhase,
        validationStatus: response.metadata?.validationStatus,
      },
    });

    await session.save();

    const questionNumber = questionFlowService.getQuestionNumber(session.currentQuestion);
    const progress = questionFlowService.getProgress(session.currentQuestion);

    res.json({
      message: finalContent,
      metadata: response.metadata,
      progress,
      questionNumber,
      phase: session.currentPhase,
      currentQuestion: session.currentQuestion,
    });
  } catch (error) {
    logger.error('Chat message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// ── POST /api/chat/start ──────────────────────────────────────────────────
router.post('/start', [
  body('sessionId').isMongoId(),
], async (req, res) => {
  try {
    const { sessionId, lang = 'tr' } = req.body;
    const userId = req.user._id;

    const session = await Session.findOne({ _id: sessionId, userId });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Welcome message + first question
    const welcome = questionFlowService.getWelcomeMessage(lang);
    const firstQ   = questionFlowService.formatQuestionMessage('A1', lang);
    const fullMsg  = firstQ ? `${welcome}\n\n---\n\n${firstQ}` : welcome;

    session.messages.push({
      role: 'assistant',
      content: fullMsg,
      metadata: { questionId: 'A1', phase: 1 },
    });
    await session.save();

    const questionNumber = questionFlowService.getQuestionNumber(session.currentQuestion);
    const progress = questionFlowService.getProgress(session.currentQuestion);

    res.json({
      message: fullMsg,
      progress,
      questionNumber,
      phase: session.currentPhase,
      currentQuestion: session.currentQuestion,
    });
  } catch (error) {
    logger.error('Chat start error:', error);
    res.status(500).json({ error: 'Failed to start chat' });
  }
});

module.exports = router;
