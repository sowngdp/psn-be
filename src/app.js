'use strict';

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const swaggerUI = require('swagger-ui-express');
const swaggerSpecs = require('./configs/swagger');
require('./configs/db');

// Import routes
const apiRoutes = require('./api/routes');

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

// API docs với Swagger
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "PSN API Documentation"
}));

// API routes
app.use('/v1/api', apiRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với Personal Style Network API',
    version: '1.0.0',
    docs: '/api-docs'
  });
});

// Xử lý lỗi 404
app.use((req, res, next) => {
  const error = new Error('Không tìm thấy');
  error.status = 404;
  next(error);
});

// Xử lý lỗi
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Lỗi server',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

module.exports = app;
