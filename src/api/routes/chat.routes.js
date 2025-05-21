'use strict';

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat.controller');
const { authentication } = require('../middlewares/authentication');
const validator = require('../middlewares/validator');
const { body, query, param } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API quản lý chat với AI
 */

// Routes
router.use(authentication); // Apply authentication to all chat routes

/**
 * @swagger
 * /chat/message:
 *   post:
 *     summary: Gửi tin nhắn và nhận phản hồi từ AI
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               chatId:
 *                 type: string
 *                 description: ID cuộc trò chuyện (tùy chọn)
 *     responses:
 *       201:
 *         description: Gửi tin nhắn thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SendMessageResponse'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/message', ChatController.sendMessage);

/**
 * @swagger
 * /chat/history:
 *   get:
 *     summary: Lấy lịch sử chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Số lượng cuộc trò chuyện mỗi trang
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Vị trí bắt đầu
 *     responses:
 *       200:
 *         description: Lấy lịch sử chat thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatHistoryResponse'
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/history', ChatController.getChatHistory);

/**
 * @swagger
 * /chat/history:
 *   delete:
 *     summary: Xóa lịch sử chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatId
 *         schema:
 *           type: string
 *         description: ID cuộc trò chuyện cụ thể (tùy chọn)
 *     responses:
 *       200:
 *         description: Xóa lịch sử thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy cuộc trò chuyện
 */
router.delete('/history', ChatController.clearHistory);

/**
 * @swagger
 * /chat/{chatId}:
 *   get:
 *     summary: Lấy thông tin chi tiết cuộc trò chuyện
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của cuộc trò chuyện
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy cuộc trò chuyện
 */
router.get('/:chatId', ChatController.getChat);

module.exports = router;
