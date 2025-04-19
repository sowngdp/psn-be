'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);
const logger = require('../utils/logger');

class ImageOptimizer {
  /**
   * Tạo thumbnail từ ảnh gốc
   * @param {Buffer} imageBuffer - Buffer của ảnh gốc
   * @param {Object} options - Các tùy chọn
   * @param {number} options.width - Chiều rộng thumbnail
   * @param {number} options.height - Chiều cao thumbnail
   * @param {string} options.fit - Cách fit ảnh (contain, cover, fill, inside, outside)
   * @param {number} options.quality - Chất lượng ảnh (1-100)
   * @returns {Promise<Buffer>} Buffer của thumbnail
   */
  static async createThumbnail(imageBuffer, options = {}) {
    const {
      width = 200,
      height = 200,
      fit = 'cover',
      quality = 80
    } = options;

    try {
      return await sharp(imageBuffer)
        .resize(width, height, { fit })
        .jpeg({ quality })
        .toBuffer();
    } catch (error) {
      logger.error('Error creating thumbnail:', error);
      throw new Error('Không thể tạo thumbnail: ' + error.message);
    }
  }

  /**
   * Tối ưu hóa ảnh cho web
   * @param {Buffer} imageBuffer - Buffer của ảnh gốc
   * @param {Object} options - Các tùy chọn
   * @param {number} options.width - Chiều rộng tối đa
   * @param {number} options.height - Chiều cao tối đa
   * @param {number} options.quality - Chất lượng ảnh (1-100)
   * @param {boolean} options.withoutEnlargement - Không phóng to ảnh nếu nhỏ hơn kích thước đích
   * @returns {Promise<Buffer>} Buffer của ảnh đã tối ưu
   */
  static async optimizeForWeb(imageBuffer, options = {}) {
    const {
      width = 1200,
      height = 1200,
      quality = 80,
      withoutEnlargement = true
    } = options;

    try {
      return await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement
        })
        .jpeg({ quality, progressive: true })
        .toBuffer();
    } catch (error) {
      logger.error('Error optimizing image for web:', error);
      throw new Error('Không thể tối ưu hóa ảnh: ' + error.message);
    }
  }

  /**
   * Chuyển đổi ảnh sang định dạng WebP
   * @param {Buffer} imageBuffer - Buffer của ảnh gốc
   * @param {Object} options - Các tùy chọn
   * @param {number} options.quality - Chất lượng ảnh (1-100)
   * @returns {Promise<Buffer>} Buffer của ảnh WebP
   */
  static async convertToWebP(imageBuffer, options = {}) {
    const { quality = 80 } = options;

    try {
      return await sharp(imageBuffer)
        .webp({ quality })
        .toBuffer();
    } catch (error) {
      logger.error('Error converting to WebP:', error);
      throw new Error('Không thể chuyển đổi sang WebP: ' + error.message);
    }
  }

  /**
   * Lưu nhiều kích thước và định dạng ảnh cho responsive web
   * @param {Buffer} imageBuffer - Buffer của ảnh gốc
   * @param {string} outputDir - Thư mục đầu ra
   * @param {string} filename - Tên file (không có extension)
   * @returns {Promise<Object>} Đối tượng chứa các đường dẫn đến các phiên bản ảnh
   */
  static async createResponsiveImages(imageBuffer, outputDir, filename) {
    try {
      // Đảm bảo thư mục đầu ra tồn tại
      await mkdirAsync(outputDir, { recursive: true });

      // Các kích thước responsive khác nhau
      const sizes = [
        { width: 320, suffix: 'xs' },
        { width: 640, suffix: 'sm' },
        { width: 960, suffix: 'md' },
        { width: 1280, suffix: 'lg' },
        { width: 1920, suffix: 'xl' }
      ];

      const results = {
        original: path.join(outputDir, `${filename}.jpg`),
        webp: {},
        jpg: {}
      };

      // Lưu ảnh gốc
      await writeFileAsync(
        results.original,
        await sharp(imageBuffer).jpeg({ quality: 90 }).toBuffer()
      );

      // Tạo và lưu các phiên bản khác nhau
      const promises = sizes.map(async (size) => {
        const resizedBuffer = await sharp(imageBuffer)
          .resize(size.width, null, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();

        // WebP
        const webpFilename = `${filename}_${size.suffix}.webp`;
        const webpPath = path.join(outputDir, webpFilename);
        await writeFileAsync(
          webpPath,
          await sharp(resizedBuffer).webp({ quality: 80 }).toBuffer()
        );
        results.webp[size.suffix] = webpPath;

        // JPEG
        const jpgFilename = `${filename}_${size.suffix}.jpg`;
        const jpgPath = path.join(outputDir, jpgFilename);
        await writeFileAsync(
          jpgPath,
          await sharp(resizedBuffer).jpeg({ quality: 80, progressive: true }).toBuffer()
        );
        results.jpg[size.suffix] = jpgPath;
      });

      await Promise.all(promises);
      return results;
    } catch (error) {
      logger.error('Error creating responsive images:', error);
      throw new Error('Không thể tạo responsive images: ' + error.message);
    }
  }
}

module.exports = ImageOptimizer; 