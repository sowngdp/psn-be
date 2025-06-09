'use strict';

const express = require('express');
const router = express.Router();
const { authentication } = require('../middlewares/authentication');
const OutfitController = require('../controllers/outfit.controller');

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
 *                 description: Tên trang phục
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemId
 *                   properties:
 *                     itemId:
 *                       type: string
 *                 description: Danh sách itemId trong trang phục
 *               imageBase64:
 *                 type: string
 *                 description: Ảnh trang phục ở định dạng base64
 *               description:
 *                 type: string
 *                 description: Mô tả trang phục
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
 *         name: styleType
 *         schema:
 *           type: string
 *         description: Lọc theo kiểu phong cách
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
 * /outfits/recommendations:
 *   get:
 *     summary: Lấy gợi ý trang phục dựa trên các tiêu chí
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: occasion
 *         schema:
 *           type: string
 *         description: Dịp (ví dụ như formal, casual, workout)
 *       - in: query
 *         name: weather
 *         schema:
 *           type: string
 *         description: Điều kiện thời tiết (ví dụ như rainy, sunny, cold)
 *       - in: query
 *         name: season
 *         schema:
 *           type: string
 *         description: Mùa (spring, summer, fall, winter)
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Màu sắc chủ đạo
 *       - in: query
 *         name: styleType
 *         schema:
 *           type: string
 *         description: Kiểu phong cách
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Số lượng gợi ý trả về
 *     responses:
 *       200:
 *         description: Gợi ý trang phục
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/recommendations', authentication, OutfitController.getOutfitRecommendations);

/**
 * @swagger
 * /outfits/statistics:
 *   get:
 *     summary: Lấy thống kê về trang phục
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *         description: Khoảng thời gian thống kê
 *     responses:
 *       200:
 *         description: Thống kê trang phục
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/statistics', authentication, OutfitController.getOutfitStatistics);

/**
 * @swagger
 * /outfits/weather:
 *   get:
 *     summary: Lấy trang phục phù hợp với thời tiết
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: temperature
 *         schema:
 *           type: number
 *         description: Nhiệt độ hiện tại (độ C)
 *       - in: query
 *         name: weatherCondition
 *         schema:
 *           type: string
 *         description: Điều kiện thời tiết (ví dụ như rainy, sunny, cloudy)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Số lượng trang phục trả về
 *     responses:
 *       200:
 *         description: Trang phục phù hợp với thời tiết
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/weather', authentication, OutfitController.getOutfitsForWeather);

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
 *               date:
 *                 type: string
 *                 format: date
 *               event:
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

/**
 * @swagger
 * /outfits/compose:
 *   post:
 *     summary: Ghép nhiều ảnh vật phẩm vào một ảnh tổng hợp
 *     tags: [Outfits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   description: Đường dẫn local hoặc link ảnh (http/https)
 *                 position:
 *                   type: string
 *                   enum: [top-left, top-center, top-right, middle-left, middle-center, middle-right, bottom-left, bottom-center, bottom-right]
 *                   description: Vị trí ghép ảnh lên nền
 *               required:
 *                 - imageUrl
 *                 - position
 *     responses:
 *       200:
 *         description: Ảnh đã ghép thành công (PNG)
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       500:
 *         description: Lỗi hệ thống
 */
router.post('/compose', authentication, OutfitController.composeItemImage);

module.exports = router; 
