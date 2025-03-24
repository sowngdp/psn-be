'use strict';

const express = require('express');
const router = express.Router();
const RecommendationController = require('../../controllers/recommendation.controller');
const { authentication } = require('../../auth/authUtils');

/**
 * @swagger
 * tags:
 *   name: Recommendations
 *   description: API quản lý đề xuất trang phục
 */

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
 *                 enum: [daily, event, weather, season, style, occasion]
 *               context:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   weather:
 *                     type: object
 *                     properties:
 *                       temperature:
 *                         type: number
 *                       condition:
 *                         type: string
 *                       humidity:
 *                         type: number
 *                   occasion:
 *                     type: string
 *                   location:
 *                     type: string
 *                   promptText:
 *                     type: string
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [daily, event, weather, season, style, occasion]
 *         description: Lọc theo loại đề xuất
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
 *     summary: Cập nhật phản hồi người dùng cho đề xuất
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
 *         description: Cập nhật phản hồi thành công
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy đề xuất
 */
router.post('/:id/feedback', authentication, RecommendationController.updateFeedback);

/**
 * @swagger
 * /recommendations/{id}/used:
 *   post:
 *     summary: Đánh dấu đề xuất đã được sử dụng
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
 *         description: Đánh dấu đề xuất đã sử dụng thành công
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy đề xuất
 */
router.post('/:id/used', authentication, RecommendationController.markAsUsed);

/**
 * @swagger
 * /recommendations/occasion:
 *   post:
 *     summary: Tạo đề xuất dựa trên dịp
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
 *               - occasion
 *             properties:
 *               occasion:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tạo đề xuất theo dịp thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/occasion', authentication, RecommendationController.getOccasionRecommendation);

/**
 * @swagger
 * /recommendations/weather:
 *   post:
 *     summary: Tạo đề xuất dựa trên thời tiết
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
 *               - temperature
 *             properties:
 *               temperature:
 *                 type: number
 *               condition:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tạo đề xuất theo thời tiết thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/weather', authentication, RecommendationController.getWeatherRecommendation);

/**
 * @swagger
 * /recommendations/season:
 *   post:
 *     summary: Tạo đề xuất dựa trên mùa
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               season:
 *                 type: string
 *                 enum: [spring, summer, fall, winter]
 *     responses:
 *       200:
 *         description: Tạo đề xuất theo mùa thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/season', authentication, RecommendationController.getSeasonRecommendation);

module.exports = router; 