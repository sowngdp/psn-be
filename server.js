'use strict';

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { connectDB } = require('./src/config/db');
const { PORT } = require('./src/config/env');

// Import routes
const apiRoutes = require('./src/api/routes');

// Khởi tạo app
const app = express();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(compression());

// Thiết lập thư mục tĩnh
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Tạo thư mục uploads nếu chưa tồn tại
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads', { recursive: true });
}

// API routes
app.use('/v1/api', apiRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Personal Style Network API',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

// Xử lý lỗi 404
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Xử lý lỗi
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

// Khởi động server
const port = PORT || 3052;

// Kết nối MongoDB trước khi khởi động server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`PSN-BE server is running on port ${port}`);
  });
}).catch(err => {
  console.error(`Server failed to start due to database connection error: ${err.message}`);
});

module.exports = app;