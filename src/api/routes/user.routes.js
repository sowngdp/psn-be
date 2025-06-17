'use strict';

const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authentication } = require('../middlewares/authentication');
const validator = require('../middlewares/validator');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 5MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh'));
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng
 */

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Lấy thông tin profile của người dùng hiện tại
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile người dùng
 *       401:
 *         description: Không được ủy quyền
 */
router.get('/profile', authentication, UserController.getCurrentUserProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Cập nhật thông tin profile người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bodyType:
 *                 type: string
 *                 enum: [hourglass, pear, apple, rectangle, inverted_triangle]
 *               seasonPreferences:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [spring, summer, fall, winter]
 *               favoriteColors:
 *                 type: array
 *                 items:
 *                   type: string
 *               stylePreferences:
 *                 type: array
 *                 items:
 *                   type: string
 *               measurements:
 *                 type: object
 *                 properties:
 *                   height:
 *                     type: number
 *                   weight:
 *                     type: number
 *                   bust:
 *                     type: number
 *                   waist:
 *                     type: number
 *                   hips:
 *                     type: number
 *     responses:
 *       200:
 *         description: Cập nhật profile thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.put('/profile', authentication, UserController.updateUserProfile);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Thông tin người dùng
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/:id', authentication, UserController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thông tin người dùng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.put('/:id', authentication, UserController.updateUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách người dùng (chỉ admin)
 *     tags: [Users]
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
 *         name: sort
 *         schema:
 *           type: string
 *           default: ctime
 *         description: Sắp xếp theo (ctime, mtime)
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *       401:
 *         description: Không được ủy quyền
 *       403:
 *         description: Không có quyền truy cập
 */
router.get('/', authentication, UserController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Xóa người dùng (chỉ admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng
 *     responses:
 *       200:
 *         description: Xóa người dùng thành công
 *       401:
 *         description: Không được ủy quyền
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.delete('/:id', authentication, UserController.deleteUser);

/**
 * @swagger
 * /users/link/google:
 *   post:
 *     summary: Liên kết tài khoản Google
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Token ID từ Google
 *     responses:
 *       200:
 *         description: Liên kết tài khoản thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       409:
 *         description: Xung đột (tài khoản đã được liên kết)
 */
router.post('/link/google', authentication, validator.googleIdToken, UserController.linkGoogleAccount);

/**
 * @swagger
 * /users/unlink/{provider}:
 *   delete:
 *     summary: Hủy liên kết tài khoản
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, apple]
 *         description: Provider cần hủy liên kết
 *     responses:
 *       200:
 *         description: Hủy liên kết thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 *       404:
 *         description: Không tìm thấy provider
 */
router.delete('/unlink/:provider', authentication, UserController.unlinkProvider);

/**
 * @swagger
 * /users/name:
 *   put:
 *     summary: Đổi tên người dùng
 *     tags: [Users]
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
 *                 description: Tên mới của người dùng
 *     responses:
 *       200:
 *         description: Đổi tên người dùng thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.put('/name', authentication, UserController.changeUserName);

/**
 * @swagger
 * /users/avatar:
 *   put:
 *     summary: Đổi avatar người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh avatar mới
 *     responses:
 *       200:
 *         description: Cập nhật avatar thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Không được ủy quyền
 */
router.put('/avatar', authentication, upload.single('avatar'), UserController.changeUserAvatar);

module.exports = router;
