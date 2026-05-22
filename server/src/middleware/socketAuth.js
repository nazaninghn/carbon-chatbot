const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      // Give the client an actionable message so it can distinguish
      // an expired token (needs refresh/re-login) from a forged one.
      if (jwtErr.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      return next(new Error('Invalid token'));
    }

    // Verify the user still exists and is active.
    // The HTTP middleware (auth.js) does this check; the socket middleware
    // must do it too — otherwise a deleted or deactivated user retains
    // full WebSocket access for the entire remaining JWT lifetime.
    const user = await User.findById(decoded.userId).select('isActive').lean();
    if (!user || !user.isActive) {
      return next(new Error('Account not found or inactive'));
    }

    socket.userId   = decoded.userId;
    socket.userName = decoded.name;
    next();
  } catch (error) {
    logger.error('Socket auth error:', error.message);
    next(new Error('Authentication failed'));
  }
};
