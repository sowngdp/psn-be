'use strict';

const winston = require('winston');
const { format, transports } = winston;
const { combine, timestamp, printf, colorize, json, errors } = format;
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Custom format for development logs - colorized and readable
 */
const devFormat = printf(({ level, message, timestamp, errorId, requestId, ...meta }) => {
  const baseLog = `${timestamp} [${level}]${requestId ? ` [${requestId}]` : ''}${errorId ? ` [Error: ${errorId}]` : ''}: ${message}`;
  
  // Add metadata if it exists
  if (Object.keys(meta).length > 0) {
    if (meta.error && meta.error.stack) {
      return `${baseLog}\n${meta.error.stack}`;
    }
    return `${baseLog} ${JSON.stringify(meta, null, 2)}`;
  }
  
  return baseLog;
});

/**
 * Configure logging based on environment
 */
const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  devFormat
);

const productionFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * Create the logger instance
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { service: 'psn-api' },
  transports: [
    // Always log to console
    new transports.Console(),
    
    // Log errors to a dedicated file
    new transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Log all levels to a combined file
    new transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exitOnError: false
});

/**
 * Add request context information to logs
 * @param {Object} req - Express request object
 * @returns {Object} - Logger with request context
 */
logger.withRequest = (req) => {
  const requestId = req.headers['x-request-id'] || 
                    req.headers['x-correlation-id'] || 
                    `req_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
  
  // Create a child logger with request context
  return {
    error: (message, meta = {}) => logger.error(message, { requestId, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { requestId, ...meta }),
    info: (message, meta = {}) => logger.info(message, { requestId, ...meta }),
    http: (message, meta = {}) => logger.http(message, { requestId, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { requestId, ...meta }),
  };
};

/**
 * Create a logger middleware that logs all HTTP requests
 * @returns {Function} Express middleware function
 */
logger.middleware = () => {
  return (req, res, next) => {
    const requestId = req.headers['x-request-id'] || 
                      req.headers['x-correlation-id'] || 
                      `req_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
    
    // Add requestId to request object for later use
    req.requestId = requestId;
    
    // Set response header with request ID for tracking
    res.setHeader('x-request-id', requestId);
    
    // Log request
    logger.http(`${req.method} ${req.url}`, {
      requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Calculate response time
    const start = Date.now();
    
    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? 'warn' : 'http';
      
      logger[level](`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
        requestId,
        statusCode: res.statusCode,
        duration,
      });
    });
    
    next();
  };
};

module.exports = logger; 