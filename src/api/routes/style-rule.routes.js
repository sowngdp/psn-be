'use strict';

const express = require('express');
const router = express.Router();
const { authentication } = require('../middlewares/authentication');
const StyleRuleController = require('../controllers/style-rule.controller');

/**
 * @swagger
 * tags:
 *   name: StyleRules
 *   description: API quản lý quy tắc phong cách
 */

/**
 * @swagger
 * /style-rules:
 *   get:
 *     summary: Lấy danh sách quy tắc phong cách
 *     tags: [StyleRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ruleType
 *         schema:
 *           type: string
 *         description: Lọc theo loại quy tắc
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Lọc theo trạng thái hoạt động
 *     responses:
 *       200:
 *         description: Danh sách quy tắc phong cách
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/', authentication, StyleRuleController.getStyleRules);

/**
 * @swagger
 * /style-rules/{id}:
 *   get:
 *     summary: Lấy thông tin quy tắc phong cách theo ID
 *     tags: [StyleRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của quy tắc phong cách
 *     responses:
 *       200:
 *         description: Thông tin quy tắc phong cách
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy quy tắc phong cách
 */
router.get('/:id', authentication, StyleRuleController.getStyleRuleById);

/**
 * @swagger
 * /style-rules:
 *   post:
 *     summary: Tạo quy tắc phong cách mới
 *     tags: [StyleRules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ruleType
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               ruleType:
 *                 type: string
 *                 enum: [color_combination, pattern_matching, proportion, occasion, body_type, season, general]
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     attribute:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [equals, not_equals, greater_than, less_than, contains, not_contains]
 *                     value:
 *                       type: object
 *               recommendations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [replace, add, remove, change_color, general]
 *                     description:
 *                       type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Tạo quy tắc phong cách thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/', authentication, StyleRuleController.createStyleRule);

/**
 * @swagger
 * /style-rules/{id}:
 *   put:
 *     summary: Cập nhật quy tắc phong cách
 *     tags: [StyleRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của quy tắc phong cách
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *               recommendations:
 *                 type: array
 *                 items:
 *                   type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Cập nhật quy tắc phong cách thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy quy tắc phong cách
 */
router.put('/:id', authentication, StyleRuleController.updateStyleRule);

/**
 * @swagger
 * /style-rules/{id}:
 *   delete:
 *     summary: Xóa quy tắc phong cách
 *     tags: [StyleRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của quy tắc phong cách
 *     responses:
 *       200:
 *         description: Xóa quy tắc phong cách thành công
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy quy tắc phong cách
 */
router.delete('/:id', authentication, StyleRuleController.deleteStyleRule);

/**
 * @swagger
 * /style-rules/evaluate:
 *   post:
 *     summary: Đánh giá trang phục theo quy tắc phong cách
 *     tags: [StyleRules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - outfitId
 *             properties:
 *               outfitId:
 *                 type: string
 *               ruleTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [color_combination, pattern_matching, proportion, occasion, body_type, season, general]
 *     responses:
 *       200:
 *         description: Đánh giá trang phục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy trang phục
 */
router.post('/evaluate', authentication, StyleRuleController.evaluateOutfit);

module.exports = router; 
