'use strict';

const path = require('path');
const fs = require('fs');
const storageConfig = require('../configs/storage');
const logger = require('../utils/logger');
const { BadRequestError } = require('../core/error.response');

class StorageService {
  constructor() {
    this.storageType = storageConfig.default;
    
    // Tạm thời sử dụng lưu trữ local
    this.localStoragePath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
    
    // Thông báo khi khởi tạo
    logger.info(`Storage service initialized with type: ${this.storageType} (fallback to local if dependencies missing)`);
  }
  
  /**
   * Tải file lên cloud storage hoặc local
   */
  async uploadFile(file, folder = 'uploads') {
    try {
      if (!file) throw new BadRequestError('Không tìm thấy file');
      
      // Kiểm tra định dạng file
      if (storageConfig.common.allowedMimetypes.length > 0 && 
          !storageConfig.common.allowedMimetypes.includes(file.mimetype)) {
        throw new BadRequestError('Định dạng file không được hỗ trợ');
      }
      
      // Kiểm tra kích thước file
      if (storageConfig.common.maxFileSize && file.size > storageConfig.common.maxFileSize) {
        throw new BadRequestError(`Kích thước file không được vượt quá ${storageConfig.common.maxFileSize / (1024 * 1024)}MB`);
      }
      
      // Fallback to local storage
      return await this._uploadToLocal(file, folder);
    } catch (error) {
      logger.error('Upload file error:', error);
      throw error;
    }
  }
  
  /**
   * Lưu file vào local storage
   * @private
   */
  async _uploadToLocal(file, folder) {
    try {
      const fileName = `${Date.now()}-${path.basename(file.originalname || 'file')}`;
      const filePath = path.join(this.localStoragePath, folder);
      
      // Tạo thư mục nếu chưa tồn tại
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true });
      }
      
      const fullPath = path.join(filePath, fileName);
      
      // Nếu file đã ở dạng Buffer
      if (file.buffer) {
        fs.writeFileSync(fullPath, file.buffer);
      } 
      // Nếu file có path
      else if (file.path) {
        fs.copyFileSync(file.path, fullPath);
      }
      // Nếu file là stream
      else if (file.stream) {
        const writeStream = fs.createWriteStream(fullPath);
        file.stream.pipe(writeStream);
        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });
      } else {
        throw new Error('Unsupported file format');
      }
      
      // Trả về đường dẫn truy cập
      return `/uploads/${folder}/${fileName}`;
    } catch (error) {
      logger.error('Error saving file locally:', error);
      throw error;
    }
  }
  
  /**
   * Xóa file
   */
  async deleteFile(fileUrl) {
    try {
      // Xử lý xóa file local
      if (fileUrl.startsWith('/uploads/')) {
        const relativePath = fileUrl.slice('/uploads/'.length);
        const fullPath = path.join(this.localStoragePath, relativePath);
        
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      logger.error('Delete file error:', error);
      return false;
    }
  }
}

// Singleton pattern
const instance = new StorageService();
Object.freeze(instance);

module.exports = instance; 