'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { connectDB } = require('./config/db');
const routes = require('./api/routes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const rateLimit = require('express-rate-limit');
const { API_VERSION } = require('./config/env');

const app = express();

// Kết nối database
connectDB();

// Cấu hình Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Personal Style Network API',
      version: '1.0.0',
      description: 'API cho ứng dụng Personal Style Network',
    },
    servers: [
      {
        url: `/${API_VERSION}/api`,
        description: 'API version 1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/api/routes/**/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Giới hạn mỗi IP tối đa 100 request trong 15 phút
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use(`/${API_VERSION}/api`, routes);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Xử lý 404
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Xử lý lỗi
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    status: 'error',
    code: error.status || 500,
    message: error.message || 'Internal Server Error',
  });
});

module.exports = app;
