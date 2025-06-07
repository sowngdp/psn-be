'use strict';

const winston = require('winston');
const { format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Định dạng log cho môi trường development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
});

// Logger cho môi trường development
const developmentLogger = winston.createLogger({
  level: 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    devFormat
  ),
  transports: [
    new transports.Console()
  ]
});

// Logger cho môi trường production
const productionLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Chọn logger phù hợp dựa vào môi trường
const logger = process.env.NODE_ENV === 'production' ? productionLogger : developmentLogger;

module.exports = logger;
