'use strict';

const express = require('express');
const router = express.Router();
const { authentication } = require('../../auth/authUtils');
const OutfitController = require('../../controllers/outfit.controller');

/**
 * @swagger
 * tags:
 *   name: Outfits
 *   description: API quản lý trang phục
 */

/**
 * @swagger
 * /outfits:
 *   post:
 *     summary: Tạo mới trang phục
 *     tags: [Outfits]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               season:
 *                 type: string
 *                 enum: [spring, summer, fall, winter, all]
 *               occasion:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tạo trang phục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.post('/', authentication, OutfitController.createOutfit);

/**
 * @swagger
 * /outfits:
 *   get:
 *     summary: Lấy danh sách trang phục của người dùng
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: Lọc theo mùa
 *       - in: query
 *         name: occasion
 *         schema:
 *           type: string
 *         description: Lọc theo dịp
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
 *         description: Danh sách trang phục
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/', authentication, OutfitController.getUserOutfits);

/**
 * @swagger
 * /outfits/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết trang phục
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trang phục
 *     responses:
 *       200:
 *         description: Thông tin chi tiết trang phục
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy trang phục
 */
router.get('/:id', authentication, OutfitController.getOutfitById);

/**
 * @swagger
 * /outfits/{id}:
 *   put:
 *     summary: Cập nhật thông tin trang phục
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trang phục
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
 *               season:
 *                 type: string
 *                 enum: [spring, summer, fall, winter, all]
 *               occasion:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Cập nhật trang phục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy trang phục
 */
router.put('/:id', authentication, OutfitController.updateOutfit);

/**
 * @swagger
 * /outfits/{id}:
 *   delete:
 *     summary: Xóa trang phục
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trang phục
 *     responses:
 *       200:
 *         description: Xóa trang phục thành công
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy trang phục
 */
router.delete('/:id', authentication, OutfitController.deleteOutfit);

/**
 * @swagger
 * /outfits/{id}/worn:
 *   post:
 *     summary: Đánh dấu trang phục đã mặc
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trang phục
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               wornDate:
 *                 type: string
 *                 format: date
 *               occasion:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đánh dấu trang phục đã mặc thành công
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy trang phục
 */
router.post('/:id/worn', authentication, OutfitController.markOutfitAsWorn);

/**
 * @swagger
 * /outfits/{id}/items:
 *   post:
 *     summary: Thêm vật phẩm vào trang phục
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trang phục
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itemId
 *             properties:
 *               itemId:
 *                 type: string
 *               position:
 *                 type: string
 *                 enum: [top, bottom, outer, accessory, footwear, other]
 *     responses:
 *       200:
 *         description: Thêm vật phẩm vào trang phục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy trang phục hoặc vật phẩm
 */
router.post('/:id/items', authentication, OutfitController.addItemToOutfit);

/**
 * @swagger
 * /outfits/{outfitId}/items/{itemId}:
 *   delete:
 *     summary: Xóa vật phẩm khỏi trang phục
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: outfitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của trang phục
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của vật phẩm
 *     responses:
 *       200:
 *         description: Xóa vật phẩm khỏi trang phục thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy trang phục hoặc vật phẩm
 */
router.delete('/:outfitId/items/:itemId', authentication, OutfitController.removeItemFromOutfit);

module.exports = router; 