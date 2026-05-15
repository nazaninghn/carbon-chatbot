const Session = require('../models/Session');
const ragService = require('../services/ragService');
const questionFlowService = require('../services/questionFlowService');
const logger = require('../utils/logger');

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
      const { message, sessionId } = data;
      if (!message || !sessionId) return;

      const session = await Session.findOne({ _id: sessionId, userId: socket.userId });
      if (!session) {
        socket.emit('error', { message: 'Session not found' });
        return;
      }

      // Emit typing indicator
      socket.emit('typing', { isTyping: true });

      // Add user message
      session.messages.push({
        role: 'user',
        content: message,
        metadata: { questionId: session.currentQuestion, phase: session.currentPhase },
      });

      // Process with RAG
      const sessionContext = {
        currentPhase: session.currentPhase,
        currentQuestion: session.currentQuestion,
        reportData: session.reportData,
      };

      const response = await ragService.processMessage(
        message,
        sessionContext,
        session.messages.slice(-10)
      );

      // Add assistant response
      session.messages.push({
        role: 'assistant',
        content: response.content,
        metadata: {
          questionId: session.currentQuestion,
          phase: session.currentPhase,
          ragContext: response.ragChunks,
          validationStatus: response.metadata?.validationStatus,
        },
      });

      // Update state if valid answer
      if (response.metadata?.validationStatus === 'valid') {
        session.reportData[session.currentQuestion] = message;
        const nextQuestion = questionFlowService.getNextQuestion(
          session.currentQuestion,
          session.reportData
        );
        if (nextQuestion) {
          session.currentQuestion = nextQuestion;
          const nextDef = questionFlowService.getQuestion(nextQuestion);
          if (nextDef) session.currentPhase = nextDef.phase;
        }
      }

      await session.save();

      // Stop typing and send response
      socket.emit('typing', { isTyping: false });
      socket.emit('message', {
        content: response.content,
        metadata: response.metadata,
        progress: questionFlowService.getProgress(session.currentQuestion),
        currentQuestion: session.currentQuestion,
        currentPhase: session.currentPhase,
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
