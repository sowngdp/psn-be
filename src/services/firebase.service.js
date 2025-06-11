'use strict';

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require("firebase/storage");
const { firebaseConfig } = require('../configs/config.firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const logger = require('../utils/logger');

class FirebaseService {
    constructor() {
        try {
            const appName = 'psn-app';
            // Check if Firebase app with appName already exists, otherwise initialize a new one
            if (!getApps().some(app => app.name === appName)) {
                this.app = initializeApp(firebaseConfig, appName);
                logger.info('Firebase initialized successfully');
            } else {
                this.app = getApp(appName);
                logger.info('Firebase app already initialized, reusing instance');
            }
            this.storage = getStorage(this.app);
        } catch (error) {
            logger.error('Firebase initialization error:', error);
            throw error;
        }
    }

    static getInstance() {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }

    /**
     * Upload a buffer to Firebase Storage
     * @param {Buffer} buffer - The file buffer to upload
     * @param {Object} options - Upload options
     * @param {string} options.fileName - Optional file name, will generate UUID if not provided
     * @param {string} options.fileExtension - File extension (jpg, png, etc.)
     * @param {string} options.contentType - MIME type of the file
     * @param {string} options.folder - Storage folder path
     * @returns {Promise<string>} - Public URL of the uploaded file
     */
    async uploadBuffer(buffer, options = {}) {
        try {
            const {
                fileName = uuidv4(),
                fileExtension = 'jpg',
                contentType = 'image/jpeg',
                folder = 'items'
            } = options;
            
            const fullFileName = `${fileName}.${fileExtension}`;
            const storageRef = ref(this.storage, `${folder}/${fullFileName}`);
            
            // Create file metadata including the content type
            const metadata = {
                contentType: contentType,
            };
            
            logger.info(`Uploading file to Firebase Storage: ${folder}/${fullFileName}`);
            
            // Upload the file
            const snapshot = await uploadBytes(storageRef, buffer, metadata);
            
            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            logger.info(`File uploaded successfully. URL: ${downloadURL}`);
            
            return downloadURL;
        } catch (error) {
            logger.error('Error uploading file to Firebase Storage:', error);
            throw error;
        }
    }

    /**
     * Delete a file from Firebase Storage
     * @param {string} fileUrl - Public URL of the file to delete
     * @returns {Promise<boolean>} - True if deleted successfully
     */
    async deleteFile(fileUrl) {
        try {
            // Extract the file path from the URL
            const urlObj = new URL(fileUrl);
            const filePath = decodeURIComponent(urlObj.pathname.split('/o/')[1]?.split('?')[0]);
            
            if (!filePath) {
                logger.error('Invalid file URL format');
                return false;
            }
            
            logger.info(`Deleting file from Firebase Storage: ${filePath}`);
            
            // Create a reference to the file
            const fileRef = ref(this.storage, filePath);
            
            // Delete the file
            await deleteObject(fileRef);
            
            logger.info('File deleted successfully');
            
            return true;
        } catch (error) {
            logger.error('Error deleting file from Firebase Storage:', error);
            return false;
        }
    }

    async updateFile(fileUrl, buffer, options = {}) {
        try {
            const {
                fileName = uuidv4(),
                fileExtension = 'jpg',
                contentType = 'image/jpeg',
                folder = 'items'
            } = options;

            const fullFileName = `${fileName}.${fileExtension}`;
            const storageRef = ref(this.storage, `${folder}/${fullFileName}`);

            // Create file metadata including the content type  
            const metadata = {
                contentType: contentType,
            };

            // Upload the file
            const snapshot = await uploadBytes(storageRef, buffer, metadata);

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            logger.info(`File updated successfully. URL: ${downloadURL}`);

            return downloadURL;
        } catch (error) {
            logger.error('Error updating file in Firebase Storage:', error);
            throw error;
        }
    }

    async uploadFromLocalPath(localPath, contentType = 'image/jpeg', folder = 'items') {
        try {
            const fileName = path.basename(localPath);
            const storageRef = ref(this.storage, `${folder}/${fileName}`);

            // Read the file from local path
            const buffer = require('fs').readFileSync(localPath);

            // Create file metadata including the content type
            const metadata = {
                contentType: contentType,
            };

            logger.info(`Uploading file from local path to Firebase Storage: ${folder}/${fileName}`);

            // Upload the file
            const snapshot = await uploadBytes(storageRef, buffer, metadata);

            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            logger.info(`File uploaded successfully. URL: ${downloadURL}`);

            return downloadURL;
        } catch (error) {
            logger.error('Error uploading file from local path to Firebase Storage:', error);
            throw error;
        }
    }
    
}

// Create a singleton instance
const firebaseService = FirebaseService.getInstance();


module.exports = firebaseService; 