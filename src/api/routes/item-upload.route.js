'use strict';

const express = require('express');
const router = express.Router();
const ItemUploadController = require('../controllers/item-upload.controller');
const { singleUpload, validateUpload } = require('../middlewares/upload.middleware');
const { authentication } = require('../middlewares/authentication');

// Apply authentication middleware to all routes
router.use(authentication);

// [DEPRECATED] Không dùng nữa, chỉ giữ lại cho tương thích cũ
router.post(
  '/with-bg-removal',
  singleUpload('image'),
  ItemUploadController.uploadItemWithBgRemoval
);

// Upload ảnh, trả về imageUrl (KHÔNG tạo item). Sau đó client gọi POST /items với imageUrl để tạo item.
router.post(
  '/process-image',
  singleUpload('image'),
  ItemUploadController.processImageOnly
);

module.exports = router; 