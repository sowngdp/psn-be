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
const { init: initJwtConfig } = require('./configs/jwt');
require('./configs/database'); // Kết nối database
const logger = require('./utils/logger');

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

// // Initialize Firebase - Client SDK
// try {
//   require('./services/firebase.service');
//   console.log('Firebase Client SDK initialized successfully');
// } catch (error) {
//   console.error('Error initializing Firebase Client SDK:', error);
// }

// Khởi tạo JWT config trước khi khởi động server
let serverInitialized = false;
const initServer = async () => {
  if (serverInitialized) return;
  
  try {
    // Khởi tạo cấu hình JWT
    await initJwtConfig();
    
    // API docs với Swagger
    app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: "PSN API Documentation"
    }));

    // API routes
    app.use('/api/v1', apiRoutes);
    
    // Tương thích với các yêu cầu cũ dạng /v1/api
    app.use('/v1/api', apiRoutes);

    // Route mặc định
    app.get('/', (req, res) => {
      res.json({
        message: 'Chào mừng đến với Personal Style Network API',
        version: '1.0.0',
        docs: '/api-docs'
      });
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Xử lý lỗi 404
    app.use((req, res, next) => {
      const error = new Error('Không tìm thấy');
      error.status = 404;
      next(error);
    });

    // Xử lý lỗi
    app.use((error, req, res, next) => {
      // Log lỗi
      logger.error(`Error ${error.status || 500}: ${error.message}`, {
        stack: error.stack,
        path: req.path,
        method: req.method
      });
      
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message || 'Lỗi server',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    });
    
    serverInitialized = true;
    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

// Gọi hàm khởi tạo
initServer().catch(error => {
  console.error('Fatal error during server initialization:', error);
  process.exit(1);
});

module.exports = app;
