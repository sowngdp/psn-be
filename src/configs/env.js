'use strict';

const dotenv = require('dotenv');

// Tải biến môi trường từ file .env
dotenv.config();

// Xác định môi trường
const dev = process.env.NODE_ENV !== 'production';
const env_prefix = dev ? 'DEV_' : 'PROD_';

// MongoDB URI cho online hoặc local
let mongoURI;
if (process.env[`${env_prefix}DB_PROTOCOL`] === 'mongodb+srv') {
  mongoURI = `mongodb+srv://${process.env[`${env_prefix}DB_USERNAME`]}:${process.env[`${env_prefix}DB_PASSWORD`]}@${process.env[`${env_prefix}DB_NAME`]}`;
} else {
  mongoURI = `mongodb://${process.env[`${env_prefix}DB_HOST`]}:${process.env[`${env_prefix}DB_PORT`]}/${process.env[`${env_prefix}DB_NAME`]}`;
}

// Cấu hình cơ bản
const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env[`${env_prefix}APP_PORT`] || 3052,
  
  // MongoDB
  MONGODB_URI: mongoURI,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'personal-style-network-jwt-secret-key',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'personal-style-network-refresh-token-key',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  
  // AWS
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  
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
  },
  
  // API
  API_VERSION: 'v1',
  UPLOAD_DIR: './uploads'
};

module.exports = env; 
