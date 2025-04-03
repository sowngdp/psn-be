'use strict';

// Tạm thời sử dụng console thay vì winston nếu chưa cài đặt
const logger = {
  info: (message, meta = {}) => {
    console.log(`INFO: ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`ERROR: ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`WARN: ${message}`, meta);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`DEBUG: ${message}`, meta);
    }
  }
};

// Tạo thư mục logs nếu chưa tồn tại
const fs = require('fs');
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

module.exports = logger; 