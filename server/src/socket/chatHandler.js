const Session = require('../models/Session');
const ragService = require('../services/ragService');
const questionFlowService = require('../services/questionFlowService');
const logger = require('../utils/logger');

// Simple per-socket rate limiter: max 30 messages/minute
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 30;
const socketMsgCounts      = new WeakMap(); // socket → { count, resetAt }

module.exports = (io, socket) => {
  // Join session room
  socket.on('join_session', async (sessionId) => {
    try {
      const session = await Session.findOne({ _id: sessionId, userId: socket.userId });
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }
      socket.join(`session:${sessionId}`);
      socket.currentSessionId = sessionId;
      socket.emit('session_joined', {
        sessionId,
        currentQuestion: session.currentQuestion,
        currentPhase: session.currentPhase,
        progress: questionFlowService.getProgress(session.currentQuestion),
      });
    } catch (error) {
      logger.error('Join session error:', error);
      socket.emit('error', { message: 'Failed to join session' });
    }
  });

  // Handle chat message (real-time)
  socket.on('send_message', async (data) => {
    try {
      const { message, sessionId, lang = 'tr' } = data;
      if (!message || !sessionId) return;

      // ── Rate limiting ─────────────────────────────────────────
      const now = Date.now();
      let rl = socketMsgCounts.get(socket);
      if (!rl || now > rl.resetAt) {
        rl = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
        socketMsgCounts.set(socket, rl);
      }
      rl.count++;
      if (rl.count > RATE_LIMIT_MAX) {
        socket.emit('error', { message: lang === 'tr' ? 'Çok fazla mesaj. Lütfen yavaşlayın.' : 'Too many messages. Please slow down.' });
        return;
      }

      const session = await Session.findOne({ _id: sessionId, userId: socket.userId });
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Emit typing indicator
      socket.emit('typing', { isTyping: true });

      // Resolve numeric/text selection to option value (matches REST API behaviour)
      const resolved = questionFlowService.resolveAnswer(
        session.currentQuestion,
        message,
        lang
      );

      // Add user message
      session.messages.push({
        role: 'user',
        content: message,
        metadata: { questionId: session.currentQuestion, phase: session.currentPhase },
      });

      // Process with RAG — pass lang so LLM responds in the correct language
      const sessionContext = {
        currentPhase:    session.currentPhase,
        currentQuestion: session.currentQuestion,
        reportData:      session.reportData,
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

      // ── Strip LLM-hallucinated question text (mirrors REST /chat/message) ──
      const nextTokIdx = response.content.indexOf('[NEXT_QUESTION]');
      let finalContent = (nextTokIdx !== -1
        ? response.content.slice(0, nextTokIdx)
        : response.content.replace(/\[PREV_QUESTION\]/g, '')
      ).trim();
      finalContent = finalContent.replace(
        /\n+\*?(?:Aşama \d+|Phase \d+)\s*[·•]\s*(?:Soru|Question)\s*\d+\/\d+\*?[\s\S]*/,
        ''
      ).trim();

      // ── Advance question on valid answer ──────────────────────
      if (isValid) {
        session.reportData[session.currentQuestion] = resolved.resolved || message;
        session.markModified('reportData');

        const nextQuestion = questionFlowService.getNextQuestion(
          session.currentQuestion,
          session.reportData
        );
        if (nextQuestion) {
          session.currentQuestion = nextQuestion;
          const nextDef = questionFlowService.getQuestion(nextQuestion);
          if (nextDef) session.currentPhase = nextDef.phase;

          // Append the authoritative next question text
          const nextQMsg = questionFlowService.formatQuestionMessage(nextQuestion, lang);
          if (nextQMsg) {
            finalContent = finalContent ? `${finalContent}\n\n---\n\n${nextQMsg}` : nextQMsg;
          }
        }
      }

      // ── Handle "back" ─────────────────────────────────────────
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

      // Add assistant response
      session.messages.push({
        role: 'assistant',
        content: finalContent,
        metadata: {
          questionId:       session.currentQuestion,
          phase:            session.currentPhase,
          ragContext:       response.ragChunks,
          validationStatus: response.metadata?.validationStatus,
        },
      });

      await session.save();

      // Stop typing and send response
      socket.emit('typing', { isTyping: false });
      socket.emit('message', {
        content:         finalContent,
        metadata:        response.metadata,
        progress:        questionFlowService.getProgress(session.currentQuestion),
        questionNumber:  questionFlowService.getQuestionNumber(session.currentQuestion),
        currentQuestion: session.currentQuestion,
        currentPhase:    session.currentPhase,
      });
    } catch (error) {
      logger.error('Socket message error:', error);
      socket.emit('typing', { isTyping: false });
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.userId}`);
  });
};
