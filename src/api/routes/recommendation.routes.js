'use strict';

const express = require('express');
const router = express.Router();
const { authentication } = require('../middlewares/authentication');
const RecommendationController = require('../controllers/recommendation.controller');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: API quản lý đề xuất
 */

/**
 * @swagger
 * /recommendations/daily:
 *   get:
 *     summary: Lấy đề xuất hàng ngày
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đề xuất hàng ngày
 *       401:
 *         description: Không được ủy quyền
 */
// router.get('/daily', authentication, RecommendationController.getDailyRecommendation);

/**
 * @swagger
 * /recommendations:
 *   post:
 *     summary: Tạo đề xuất mới
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [daily, event, weather, season, style]
 *               context:
 *                 type: object
 *     responses:
 *       201:
 *         description: Tạo đề xuất thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/', authentication, RecommendationController.createRecommendation);

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Lấy danh sách đề xuất của người dùng
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Lọc theo loại đề xuất
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách đề xuất
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/', authentication, RecommendationController.getUserRecommendations);

/**
 * @swagger
 * /recommendations/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết đề xuất
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đề xuất
 *     responses:
 *       200:
 *         description: Thông tin chi tiết đề xuất
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy đề xuất
 */
router.get('/:id', authentication, RecommendationController.getRecommendationById);

/**
 * @swagger
 * /recommendations/{id}/feedback:
 *   post:
 *     summary: Gửi phản hồi về đề xuất
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đề xuất
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *               selectedOutfitId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gửi phản hồi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy đề xuất
 */
router.post('/:id/feedback', authentication, RecommendationController.updateFeedback);

module.exports = router;
