'use strict';

const { removeBackground } = require('@imgly/background-removal-node');
const firebaseService = require('./firebase.service');
const sharp = require('sharp');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Cấu hình cho background removal
const bgRemovalOptions = {
  // Đường dẫn đến thư mục chứa model và các file WASM
  publicPath: `file://${path.resolve(`node_modules/@imgly/background-removal-node/dist/`)}/`,
  // Bật chế độ debug nếu đang ở môi trường dev
  debug: process.env.NODE_ENV === 'dev',
  // Chọn model để sử dụng. Có thể là 'small' hoặc 'medium'
  model: process.env.BG_REMOVAL_MODEL === 'small' ? 'small' : 'medium',
  // Cấu hình output
  output: {
    // Format đầu ra của ảnh
    format: 'image/png',
    // Chất lượng ảnh từ 0-1
    quality: 0.9,
    // Loại đầu ra: foreground (giữ đối tượng, xóa background), background (ngược lại), hoặc mask
    type: 'foreground'
  },
  // Hiển thị tiến trình tải model
  progress: (key, current, total) => {
    logger.info(`Background removal: downloading ${key}: ${current} of ${total}`);
  }
};

class BackgroundRemovalService {
  /**
   * Remove background from an image
   * @param {Buffer} imageBuffer - Buffer của ảnh gốc
   * @returns {Promise<Buffer>} - Buffer của ảnh đã xóa background
   */
  static async removeBackground(imageBuffer) {
    try {
      logger.info('Starting background removal process');
      
      // Bỏ qua xóa background nếu biến môi trường được đặt (để test)
      if (process.env.SKIP_BG_REMOVAL === 'true') {
        logger.info('Background removal skipped due to SKIP_BG_REMOVAL flag');
        return imageBuffer;
      }
      
      // Thư viện @imgly/background-removal-node yêu cầu image phải ở dạng File/URL/Blob
      // Vì đang trong Node.js environment, cần lưu buffer tạm thời thành file để thư viện xử lý được
      logger.info('Pre-processing image by saving temporary file');
      
      // Lưu ảnh vào file tạm thời
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `temp-${uuidv4()}.jpg`);
      
      try {
        // Convert buffer to optimized JPEG và lưu vào file tạm
        await sharp(imageBuffer)
          .jpeg({ quality: 100 })
          .toFile(tempFilePath);
        
        logger.info(`Temporary file created at: ${tempFilePath}`);
        
        // Cấu hình background removal
        const localBgRemovalOptions = {
          ...bgRemovalOptions,
          output: {
            ...bgRemovalOptions.output,
            format: 'image/png'
          }
        };
        
        logger.info('Removing background with options:', { 
          model: localBgRemovalOptions.model, 
          outputFormat: localBgRemovalOptions.output.format 
        });
        
        // Thực hiện xóa background với file URL
        const fileUrl = `file://${tempFilePath}`;
        const processedBlob = await removeBackground(fileUrl, localBgRemovalOptions);
        
        // Chuyển Blob thành Buffer
        const processedBuffer = Buffer.from(await processedBlob.arrayBuffer());
        
        // Xóa file tạm
        fs.unlinkSync(tempFilePath);
        logger.info('Temporary file deleted');
        
        // Tối ưu hóa ảnh đã xử lý - luôn lưu định dạng PNG
        logger.info('Optimizing processed image as PNG');
        const optimizedImageBuffer = await sharp(processedBuffer)
          .resize({ width: 800, withoutEnlargement: true })
          .png({ quality: 90 })
          .toBuffer();
        
        logger.info('Background removal completed successfully');
        return optimizedImageBuffer;
      } catch (processError) {
        // Xóa file tạm nếu có lỗi
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
          logger.info('Temporary file deleted after error');
        }
        throw processError;
      }
    } catch (error) {
      logger.error(`Error removing background: ${error.message}`);
      logger.error(error.stack);
      
      // Log more details about the image
      try {
        const metadata = await sharp(imageBuffer).metadata();
        logger.error(`Image details: format=${metadata.format}, width=${metadata.width}, height=${metadata.height}, space=${metadata.space}`);
      } catch (metaError) {
        logger.error(`Could not get image metadata: ${metaError.message}`);
      }
      
      // Nếu xóa background thất bại, trả về ảnh gốc
      logger.warn('Returning original image due to background removal failure');
      return imageBuffer;
    }
  }

  /**
   * Lưu buffer ảnh vào Firebase Storage
   * @param {Buffer} imageBuffer - Buffer của ảnh
   * @param {String} fileExtension - Phần mở rộng của file (jpg, png,...)
   * @returns {Promise<string>} - URL công khai của ảnh đã lưu
   */
  static async saveImage(imageBuffer, fileExtension = 'png') {
    try {
      // Đảm bảo luôn sử dụng định dạng PNG cho ảnh đã xử lý
      const contentType = 'image/png';
      fileExtension = 'png';
      
      logger.info(`Saving processed image as PNG`);
      
      // Tạo tên file duy nhất
      const fileName = uuidv4();
      
      // Upload lên Firebase Storage
      const downloadURL = await firebaseService.uploadBuffer(imageBuffer, {
        fileName,
        fileExtension,
        contentType,
        folder: 'items/processed'
      });
      
      logger.info(`Image saved to Firebase Storage: ${downloadURL}`);
      return downloadURL;
    } catch (error) {
      logger.error('Error saving image to Firebase Storage:', error);
      throw error;
    }
  }

  /**
   * Xóa ảnh từ Firebase Storage
   * @param {String} imageUrl - URL của ảnh cần xóa
   * @returns {Promise<boolean>} - true nếu xóa thành công
   */
  static async deleteImage(imageUrl) {
    try {
      logger.info(`Deleting image from Firebase Storage: ${imageUrl}`);
      const result = await firebaseService.deleteFile(imageUrl);
      return result;
    } catch (error) {
      logger.error('Error deleting image from Firebase Storage:', error);
      return false;
    }
  }
}

module.exports = BackgroundRemovalService; 