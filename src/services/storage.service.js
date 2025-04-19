'use strict';

const { getBucket } = require('../configs/firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');
const logger = require('../utils/logger');
const { BadRequestError } = require('../core/error.response');

// Promisify fs functions
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

class StorageService {
  constructor() {
    // Log initialization
    logger.info('Storage service initialized with Firebase Storage');
  }
  
  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(file, folder = 'uploads') {
    try {
      if (!file) throw new BadRequestError('No file uploaded');
      
      if (file.buffer) {
        const contentType = file.mimetype || 'application/octet-stream';
        const extension = path.extname(file.originalname || '').substring(1) || 'dat';
        
        // Use the static method for Firebase storage
        return await StorageService.uploadBuffer(file.buffer, {
          fileExtension: extension,
          contentType,
          folder
        });
      } else {
        throw new BadRequestError('Unsupported file format');
      }
    } catch (error) {
      logger.error('Upload file error:', error);
      throw error;
    }
  }
  
  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(fileUrl) {
    try {
      return await StorageService.deleteFile(fileUrl);
    } catch (error) {
      logger.error('Delete file error:', error);
      return false;
    }
  }
}

// Static methods for Firebase storage
StorageService.uploadBuffer = async function(buffer, { fileExtension = 'jpg', contentType = 'image/jpeg', folder = 'items' }) {
  try {
    const bucket = getBucket();
    
    // Create a unique filename
    const filename = `${uuidv4()}.${fileExtension}`;
    
    // Define the storage path
    const storagePath = folder ? `${folder}/${filename}` : filename;
    
    // Create a temporary file
    const tempFilePath = path.join(os.tmpdir(), filename);
    await writeFileAsync(tempFilePath, buffer);
    
    // Upload the file to Firebase Storage
    const [file] = await bucket.upload(tempFilePath, {
      destination: storagePath,
      metadata: {
        contentType: contentType,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        }
      }
    });
    
    // Delete the temporary file
    await unlinkAsync(tempFilePath);
    
    // Make the file publicly accessible
    await file.makePublic();
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    
    return publicUrl;
  } catch (error) {
    logger.error('Error uploading file to Firebase Storage:', error);
    throw error;
  }
};

StorageService.deleteFile = async function(fileUrl) {
  try {
    const bucket = getBucket();
    
    // Extract the file path from the URL
    // Format: https://storage.googleapis.com/BUCKET_NAME/PATH_TO_FILE
    const urlObj = new URL(fileUrl);
    const pathWithBucket = urlObj.pathname.substring(1); // Remove leading slash
    const pathParts = pathWithBucket.split('/');
    pathParts.shift(); // Remove bucket name
    const filePath = pathParts.join('/');
    
    // Delete the file
    await bucket.file(filePath).delete();
    
    return true;
  } catch (error) {
    logger.error('Error deleting file from Firebase Storage:', error);
    return false;
  }
};

// Create a singleton instance
const storageService = new StorageService();

// Export both the instance and the class
module.exports = storageService;
module.exports.uploadBuffer = StorageService.uploadBuffer;
module.exports.deleteFile = StorageService.deleteFile; 