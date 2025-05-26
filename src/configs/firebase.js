'use strict';

const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Initialize Firebase Admin SDK
const initFirebase = () => {
  // Check if already initialized
  if (admin.apps.length) return;

  try {
    // Path to service account key file
    const serviceAccountPath = path.join(process.cwd(), 'src', 'keys', 'serviceAccountKey.json');
    
    // Check if file exists, otherwise use environment variables
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || serviceAccount.project_id + '.appspot.com'
      });
      logger.info('Firebase Admin SDK initialized with service account file');
    } 
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      // Use environment variables if they exist
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL || `firebase-adminsdk-${process.env.FIREBASE_PROJECT_ID}@appspot.gserviceaccount.com`,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
      logger.info('Firebase Admin SDK initialized with environment variables');
    }
    else {
      logger.warn('Firebase credentials not found - Firebase Storage will not be available');
      // Don't initialize Firebase - we'll fall back to local storage
      return;
    }
    
    logger.info('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    logger.warn('Firebase initialization failed - Storage will fall back to local');
  }
};

// Get Firebase Storage bucket
const getBucket = () => {
  try {
    if (!admin.apps.length) {
      initFirebase();
    }
    
    if (admin.apps.length) {
      return getStorage().bucket();
    }
    
    throw new Error('Firebase not initialized');
  } catch (error) {
    logger.error('Failed to get Firebase Storage bucket:', error);
    throw error;
  }
};

// Check if Firebase is initialized
const isFirebaseInitialized = () => {
  return admin.apps.length > 0;
};

module.exports = {
  initFirebase,
  getBucket,
  isFirebaseInitialized
}; 