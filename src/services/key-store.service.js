'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

// Schema cho System Keys
const SystemKeySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'SystemKeys',
  timestamps: true
});

const SystemKey = mongoose.model('SystemKey', SystemKeySchema);

class KeyStoreService {
  /**
   * Lấy hoặc tạo khóa hệ thống
   * @param {String} keyName - Tên khóa
   * @returns {Promise<String>} - Giá trị khóa
   */
  static async getOrCreateKey(keyName) {
    try {
      // Tìm khóa trong database
      let keyDoc = await SystemKey.findOne({ name: keyName });
      
      // Nếu không tìm thấy, tạo khóa mới
      if (!keyDoc) {
        const newKeyValue = crypto.randomBytes(64).toString('hex');
        keyDoc = await SystemKey.create({
          name: keyName,
          value: newKeyValue
        });
        console.log(`Created new system key: ${keyName}`);
      }
      
      return keyDoc.value;
    } catch (error) {
      console.error(`Error retrieving key ${keyName}:`, error);
      // Fallback - tạo khóa tạm thời (sẽ bị mất khi restart)
      return crypto.randomBytes(64).toString('hex');
    }
  }
  
  /**
   * Tạo khóa RSA mới trong database
   * @returns {Promise<Object>} - Cặp khóa public/private
   */
  static async getOrCreateRSAKeys() {
    try {
      // Tìm khóa trong database
      let privateKeyDoc = await SystemKey.findOne({ name: 'jwt-rsa-private-key' });
      let publicKeyDoc = await SystemKey.findOne({ name: 'jwt-rsa-public-key' });
      
      // Nếu không tìm thấy, tạo cặp khóa mới
      if (!privateKeyDoc || !publicKeyDoc) {
        const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
          }
        });
        
        // Lưu vào database
        if (!privateKeyDoc) {
          privateKeyDoc = await SystemKey.create({
            name: 'jwt-rsa-private-key',
            value: privateKey
          });
        }
        
        if (!publicKeyDoc) {
          publicKeyDoc = await SystemKey.create({
            name: 'jwt-rsa-public-key',
            value: publicKey
          });
        }
        
        console.log('Created new RSA key pair for JWT');
      }
      
      return {
        private: privateKeyDoc.value,
        public: publicKeyDoc.value
      };
    } catch (error) {
      console.error('Error creating RSA keys:', error);
      // Fallback - tạo khóa tạm thời (sẽ bị mất khi restart)
      const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });
      
      return { private: privateKey, public: publicKey };
    }
  }
}

module.exports = KeyStoreService; 