const winston = require('winston');
const fs = require('fs');

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Only write to files if logs/ directory is writable (not available on Render)
try {
  fs.mkdirSync('logs', { recursive: true });
  transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
} catch {
  // logs/ not writable — console only (e.g. Render, Railway)
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'carboniq' },
  transports,
});

module.exports = logger;
