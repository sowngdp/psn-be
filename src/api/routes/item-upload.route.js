'use strict';

const express = require('express');
const router = express.Router();
const ItemUploadController = require('../controllers/item-upload.controller');
const { singleUpload, validateUpload } = require('../middlewares/upload.middleware');
const { authentication } = require('../middlewares/authentication');

// Apply authentication middleware to all routes
router.use(authentication);

// Upload item with background removal and create a new item
router.post(
  '/with-bg-removal',
  singleUpload('image'),
  ItemUploadController.uploadItemWithBgRemoval
);

// Just process the image (remove background) without creating an item
router.post(
  '/process-image',
  singleUpload('image'),
  ItemUploadController.processImageOnly
);

module.exports = router; 