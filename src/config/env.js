'use strict';

const dotenv = require('dotenv');

// Tải biến môi trường từ file .env
dotenv.config();

// Xác định môi trường
const dev = process.env.NODE_ENV !== 'production';
const env_prefix = dev ? 'DEV_' : 'PROD_';

// Cấu hình cơ bản
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env[`${env_prefix}APP_PORT`] || 3052,
  
  // MongoDB
  MONGODB_URI: process.env.DEV_DB_PROTOCOL === 'mongodb+srv' ? 
    `mongodb+srv://${process.env.DEV_DB_USERNAME}:${process.env.DEV_DB_PASSWORD}${process.env.DEV_DB_NAME}` :
    `mongodb://${process.env.DEV_DB_HOST}:${process.env.DEV_DB_PORT}/${process.env.DEV_DB_NAME}`,
  
  // JWT
  JWT_SECRET: 'personal-style-network-jwt-secret-key',
  JWT_EXPIRATION: '1d',
  JWT_REFRESH_SECRET: 'personal-style-network-refresh-token-key',
  JWT_REFRESH_EXPIRATION: '7d',
  
  // API
  API_VERSION: 'v1',
  UPLOAD_DIR: './uploads',
  
  // Firebase
  FIREBASE: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  }
};

module.exports = env; 