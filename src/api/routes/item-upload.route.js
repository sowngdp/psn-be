'use strict';

const express = require('express');
const router = express.Router();
const ItemUploadController = require('../controllers/item-upload.controller');
const { singleUpload, validateUpload } = require('../middlewares/upload.middleware');
const { authentication } = require('../middlewares/authentication');

/**
 * @swagger
 * tags:
 *   name: Item Uploads
 *   description: API xử lý upload và phân tích ảnh vật phẩm
 */

// Apply authentication middleware to all routes
// router.use(authentication);

// [DEPRECATED] Không dùng nữa, chỉ giữ lại cho tương thích cũ
router.post(
  '/with-bg-removal',
  authentication,
  singleUpload('image'),
  ItemUploadController.uploadItemWithBgRemoval
);

/**
 * @swagger
 * /item-uploads/process-image:
 *   post:
 *     summary: Xử lý ảnh vật phẩm (remove background + phân tích AI)
 *     description: Upload ảnh, loại bỏ background, phân tích với Gemini AI và trả về URL cùng metadata chi tiết
 *     tags: [Item Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh vật phẩm (PNG, JPG, JPEG)
 *     responses:
 *       200:
 *         description: Xử lý ảnh thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 message:
 *                   type: string
 *                   example: 'Image processed successfully with background removed and AI analysis'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       description: URL của ảnh đã xử lý
 *                     backgroundRemoved:
 *                       type: boolean
 *                       description: Có loại bỏ background thành công hay không
 *                     aiMetadata:
 *                       type: object
 *                       nullable: true
 *                       description: Metadata từ Gemini AI analysis
 *                       properties:
 *                         category:
 *                           type: string
 *                           description: Danh mục chính của vật phẩm
 *                         subCategory:
 *                           type: string
 *                           description: Danh mục phụ cụ thể
 *                         colors:
 *                           type: object
 *                           properties:
 *                             primary:
 *                               type: string
 *                               description: Màu chính
 *                             secondary:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               description: Các màu phụ
 *                             pattern:
 *                               type: string
 *                               description: Mô tả họa tiết
 *                         style:
 *                           type: string
 *                           description: Phong cách (casual, formal, sporty, etc.)
 *                         material:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               description: Loại vải/chất liệu
 *                             texture:
 *                               type: string
 *                               description: Kết cấu
 *                             thickness:
 *                               type: string
 *                               description: Độ dày
 *                         features:
 *                           type: object
 *                           properties:
 *                             sleeves:
 *                               type: string
 *                               description: Kiểu tay áo
 *                             neckline:
 *                               type: string
 *                               description: Kiểu cổ áo
 *                             length:
 *                               type: string
 *                               description: Độ dài
 *                             fit:
 *                               type: string
 *                               description: Kiểu dáng
 *                             closure:
 *                               type: string
 *                               description: Kiểu khóa/cài
 *                             pockets:
 *                               type: boolean
 *                               description: Có túi hay không
 *                         season:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Mùa phù hợp
 *                         occasions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Dịp phù hợp
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Các từ khóa mô tả
 *                         description:
 *                           type: string
 *                           description: Mô tả chi tiết bằng tiếng Việt
 *                         confidence:
 *                           type: number
 *                           description: Độ tin cậy phân tích (0-100)
 *                         analyzedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Thời gian phân tích
 *                         source:
 *                           type: string
 *                           example: 'gemini-ai'
 *                           description: Nguồn phân tích
 *                         model:
 *                           type: string
 *                           example: 'gemini-2.0-flash-exp'
 *                           description: Model AI đã sử dụng
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không có file
 *       401:
 *         description: Không được ủy quyền
 *       500:
 *         description: Lỗi server
 */

// Upload ảnh, trả về imageUrl (KHÔNG tạo item). Sau đó client gọi POST /items với imageUrl để tạo item.
router.post(
  '/process-image',
  authentication,
  singleUpload('image'),
  ItemUploadController.processImageOnly
);

module.exports = router; 