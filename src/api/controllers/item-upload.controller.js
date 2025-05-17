'use strict';

const BackgroundRemovalService = require('../../services/background-removal.service');
const ItemService = require('../../services/item.service');
const { CREATED, OK } = require('../../core/success.response');
const { BadRequestError, InternalServerError } = require('../../core/error.response');
const logger = require('../../utils/logger');
const ImageOptimizer = require('../../helpers/image.optimizer');
const path = require('path');

class ItemUploadController {
  /**
   * Upload an item image, remove background, and create a new item
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   *  * [DEPRECATED] Upload an item image, remove background, and create a new item
   * Không dùng nữa. Hãy dùng processImageOnly để upload ảnh, sau đó gọi POST /items để tạo item với imageUrl.
   */
  static async uploadItemWithBgRemoval(req, res, next) {
    return res.status(410).json({
      message: 'API này đã ngừng sử dụng. Hãy upload ảnh qua /item-uploads/process-image, sau đó tạo item qua /items với imageUrl.',
      deprecated: true
    });
    try {
      // Check if file exists
      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      logger.info(`Processing image upload: ${req.file.originalname}, size: ${req.file.size} bytes`);

      // Get item metadata from request body
      const itemData = req.body;
      
      // Add owner ID from authenticated user
      const userId = req.user.userId;
      itemData.ownerId = userId;
      
      // Check required fields
      if (!itemData.name || !itemData.category) {
        throw new BadRequestError('Name and category are required fields');
      }

      // Process the image (remove background) - now with graceful fallback
      logger.info('Removing background from image...');
      logger.info(`File info: name=${req.file.originalname}, type=${req.file.mimetype}, size=${req.file.size}`);
      let processedImageBuffer;
      let backgroundRemoved = true;
      
      try {
        processedImageBuffer = await BackgroundRemovalService.removeBackground(req.file.buffer);
      } catch (bgError) {
        // Background removal service will now handle errors and return original image
        // This catch is just for unexpected errors
        logger.error('Unexpected error in background removal:', bgError);
        processedImageBuffer = req.file.buffer;
        backgroundRemoved = false;
      }
      
      // If we got back the same buffer, background removal failed or was skipped
      if (processedImageBuffer === req.file.buffer) {
        backgroundRemoved = false;
        logger.warn('Using original image (background removal not applied)');
      }
      
      // Tối ưu hóa ảnh trước khi tải lên
      processedImageBuffer = await ImageOptimizer.optimizeForWeb(processedImageBuffer, {
        width: 1200,
        height: 1200,
        quality: 85
      });

      // Tạo thumbnail
      const thumbnailBuffer = await ImageOptimizer.createThumbnail(processedImageBuffer, {
        width: 300,
        height: 300,
        quality: 80
      });

      // Tạo phiên bản WebP cho hiệu suất web tốt hơn
      const webpBuffer = await ImageOptimizer.convertToWebP(processedImageBuffer, {
        quality: 80
      });
      
      // Save the processed image to Firebase
      logger.info('Saving processed image to Firebase...');
      const imageExtension = 'png'; // Luôn lưu dưới dạng PNG vì đó là định dạng đầu ra của removeBackground
      let imageUrl;
      let imageId;
      let thumbnailUrl;
      let webpUrl;

      if (firebaseUploadEnabled) {
        // Tải các phiên bản ảnh lên Firebase Storage song song
        const [uploadResult, thumbnailResult, webpResult] = await Promise.all([
          // Ảnh chính
          BackgroundRemovalService.saveImage(processedImageBuffer, imageExtension),
          
          // Thumbnail
          BackgroundRemovalService.saveImage(thumbnailBuffer, imageExtension),
          
          // WebP version
          BackgroundRemovalService.saveImage(webpBuffer, imageExtension)
        ]);
        
        imageUrl = uploadResult;
        imageId = path.basename(imageUrl);
        thumbnailUrl = thumbnailResult;
        webpUrl = webpResult;
      } else {
        // Lưu vào thư mục uploads (phương án dự phòng)
        imageUrl = await BackgroundRemovalService.saveImage(processedImageBuffer, imageExtension);
        imageId = path.basename(imageUrl);
        
        thumbnailUrl = await BackgroundRemovalService.saveImage(
          thumbnailBuffer,
          imageExtension
        );
        
        webpUrl = await BackgroundRemovalService.saveImage(
          webpBuffer,
          imageExtension
        );
      }
      
      // Add image URLs to item data
      itemData.imageUrl = imageUrl;
      itemData.thumbnailUrl = thumbnailUrl;
      itemData.webpUrl = webpUrl;
      itemData.imageId = imageId;
      
      // Add flag to indicate if background was successfully removed
      itemData.backgroundRemoved = backgroundRemoved;
      
      // Create the new item in the database
      logger.info('Creating new item in database...');
      const newItem = await ItemService.createItem(itemData);
      
      // Return success response
      logger.info(`Item created successfully with ID: ${newItem._id}`);
      return new CREATED({
        message: backgroundRemoved 
          ? 'Item uploaded successfully with background removed' 
          : 'Item uploaded successfully (background removal skipped)',
        metadata: {
          item: newItem,
          imageUrl: imageUrl,
          backgroundRemoved: backgroundRemoved
        }
      }).send(res);
    } catch (error) {
      logger.error('Error in uploadItemWithBgRemoval:', error);
      next(error);
    }
  }

  /**
   * Upload an item image and remove background, trả về imageUrl (KHÔNG tạo item)
   * Client sẽ dùng imageUrl này để tạo item ở bước tiếp theo
   */
  static async processImageOnly(req, res, next) {
    try {
      if (!req.file) {
        throw new BadRequestError('Không có file nào được tải lên');
      }
      logger.info(`Processing image only: ${req.file.originalname}, size: ${req.file.size} bytes`);
      let processedImageBuffer;
      let backgroundRemoved = true;
      try {
        processedImageBuffer = await BackgroundRemovalService.removeBackground(req.file.buffer);
      } catch (bgError) {
        logger.error('Unexpected error in background removal:', bgError);
        processedImageBuffer = req.file.buffer;
        backgroundRemoved = false;
      }
      if (processedImageBuffer === req.file.buffer) {
        backgroundRemoved = false;
        logger.warn('Using original image (background removal not applied)');
      }
      logger.info('Saving processed image to Firebase...');
      const imageExtension = 'png';
      let imageUrl;
      try {
        imageUrl = await BackgroundRemovalService.saveImage(processedImageBuffer, imageExtension);
      } catch (storageError) {
        logger.error('Error saving image to Firebase:', storageError);
        throw new InternalServerError('Failed to save processed image to Firebase');
      }
      logger.info(`Image processed successfully: ${imageUrl}`);
      return new OK({
        message: backgroundRemoved
          ? 'Image processed successfully with background removed'
          : 'Image processed successfully (background removal skipped)',
        metadata: {
          imageUrl: imageUrl,
          backgroundRemoved: backgroundRemoved
        }
      }).send(res);
    } catch (error) {
      logger.error('Error in processImageOnly:', error);
      next(error);
    }
  }
}

module.exports = ItemUploadController; 