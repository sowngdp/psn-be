'use strict';

const multer = require('multer');
const path = require('path');
const { BadRequestError } = require('../../core/error.response');
const logger = require('../../utils/logger');

// Danh sách MIME types được chấp nhận
const ALLOWED_MIME_TYPES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/heic': 'heic',
  'image/heif': 'heif'
};

// Kích thước file tối đa (8MB)
const MAX_FILE_SIZE = 8 * 1024 * 1024;

// Cấu hình storage
const storage = multer.memoryStorage(); // Lưu dưới dạng buffer trong bộ nhớ để xử lý

// File filter để chỉ cho phép tải lên ảnh
const fileFilter = (req, file, cb) => {
  // Kiểm tra MIME type
  if (ALLOWED_MIME_TYPES[file.mimetype]) {
    logger.info(`Accepting file upload: ${file.originalname}, type: ${file.mimetype}`);
    cb(null, true);
  } else {
    logger.warn(`Rejected file upload: ${file.originalname}, type: ${file.mimetype} - not allowed`);
    cb(new BadRequestError(`Loại file không được chấp nhận. Các loại được phép: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`), false);
  }
};

// Cấu hình multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5 // Tối đa 5 file trong một lần upload
  },
  fileFilter: fileFilter,
});

// Bắt lỗi multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new BadRequestError(`File quá lớn. Kích thước tối đa là ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
      case 'LIMIT_FILE_COUNT':
        return next(new BadRequestError('Quá nhiều file được tải lên. Tối đa 5 file mỗi lần'));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new BadRequestError('Field name không đúng hoặc quá nhiều file'));
      default:
        return next(new BadRequestError(`Lỗi upload: ${err.message}`));
    }
  }
  next(err);
};

module.exports = {
  // Middleware cho single file upload
  singleUpload: (fieldName) => [
    upload.single(fieldName),
    handleMulterError,
    (req, res, next) => {
      if (!req.file) {
        return next(new BadRequestError('Không có file nào được tải lên'));
      }
      
      // Log thông tin file đã tải lên
      logger.info(`File uploaded: ${req.file.originalname}, size: ${req.file.size} bytes, mimetype: ${req.file.mimetype}`);
      
      // Thêm extension vào req cho tiện sử dụng
      req.file.extension = ALLOWED_MIME_TYPES[req.file.mimetype];
      next();
    }
  ],
  
  // Middleware cho multiple file upload
  multipleUpload: (fieldName, maxCount = 5) => [
    upload.array(fieldName, maxCount),
    handleMulterError,
    (req, res, next) => {
      if (!req.files || req.files.length === 0) {
        return next(new BadRequestError('Không có file nào được tải lên'));
      }
      
      // Log thông tin file đã tải lên
      logger.info(`${req.files.length} files uploaded`);
      
      // Thêm extension vào mỗi file
      req.files.forEach(file => {
        file.extension = ALLOWED_MIME_TYPES[file.mimetype];
      });
      
      next();
    }
  ],
  
  // Validate uploaded file middleware (sử dụng cho routes không sử dụng multer trực tiếp)
  validateUpload: (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
      return next(new BadRequestError('Không có file nào được tải lên'));
    }
    next();
  }
};