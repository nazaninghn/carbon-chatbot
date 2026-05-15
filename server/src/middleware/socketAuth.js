const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userName = decoded.name;
    next();
  } catch (error) {
    logger.error('Socket auth error:', error.message);
    next(new Error('Invalid token'));
  }
};
