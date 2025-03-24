'use strict';

const express = require('express');
const router = express.Router();
const { authentication } = require('../../auth/authUtils');
const ItemController = require('../../controllers/item.controller');

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: API quản lý vật phẩm
 */

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Tạo mới vật phẩm
 *     tags: [Items]
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
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [top, bottom, outerwear, dress, footwear, accessory, other]
 *               subCategory:
 *                 type: string
 *               color:
 *                 type: string
 *               pattern:
 *                 type: string
 *               brand:
 *                 type: string
 *               size:
 *                 type: string
 *               material:
 *                 type: string
 *               season:
 *                 type: string
 *                 enum: [spring, summer, fall, winter, all]
 *               occasion:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo vật phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/', authentication, ItemController.createItem);

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Lấy danh sách vật phẩm của người dùng
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
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
 *         description: Danh sách vật phẩm
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/', authentication, ItemController.getUserItems);

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết vật phẩm
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vật phẩm
 *     responses:
 *       200:
 *         description: Thông tin chi tiết vật phẩm
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy vật phẩm
 */
router.get('/:id', authentication, ItemController.getItemById);

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Cập nhật thông tin vật phẩm
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vật phẩm
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
 *               category:
 *                 type: string
 *               color:
 *                 type: string
 *               pattern:
 *                 type: string
 *               brand:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật vật phẩm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy vật phẩm
 */
router.put('/:id', authentication, ItemController.updateItem);

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Xóa vật phẩm
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vật phẩm
 *     responses:
 *       200:
 *         description: Xóa vật phẩm thành công
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy vật phẩm
 */
router.delete('/:id', authentication, ItemController.deleteItem);

module.exports = router; 