'use strict';

// Cấu hình chung cho lưu trữ
const storageConfig = {
  // Loại lưu trữ mặc định
  default: process.env.STORAGE_TYPE || 'local', // 's3', 'firebase', hoặc 'local'
  
  // Cấu hình AWS S3
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-southeast-1',
    bucket: process.env.S3_BUCKET_NAME
  },
  
  // Cấu hình Firebase
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  },
  
  // Cấu hình chung cho cả hai loại lưu trữ
  common: {
    maxFileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB
    allowedMimetypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  }
};

// Kiểm tra cấu hình cho loại lưu trữ mặc định
const validateStorageConfig = () => {
  const storageType = storageConfig.default;
  
  if (storageType === 's3') {
    const { accessKeyId, secretAccessKey, region, bucket } = storageConfig.s3;
    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      console.warn('S3 configuration is incomplete. File uploads may not work correctly.');
    }
  } else if (storageType === 'firebase') {
    const { apiKey, authDomain, projectId, storageBucket } = storageConfig.firebase;
    if (!apiKey || !authDomain || !projectId || !storageBucket) {
      console.warn('Firebase configuration is incomplete. File uploads may not work correctly.');
    }
  } else {
    console.error(`Unknown storage type: ${storageType}. Valid options are 's3', 'firebase', or 'local'.`);
  }
};

// Validate storage config
validateStorageConfig();

module.exports = storageConfig; 