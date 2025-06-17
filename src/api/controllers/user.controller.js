'use strict';

const UserService = require('../../services/user.service');
const GoogleAuthService = require('../../services/google-auth.service');
const { OK, CREATED } = require('../../core/success.response');
const { BadRequestError } = require('../../core/error.response');

class UserController {
  // Lấy thông tin người dùng theo ID
  static async getUserById(req, res, next) {
    try {
      const userId = req.params.id;
      const user = await UserService.findUserById(userId);
      return new OK({
        message: 'Lấy thông tin người dùng thành công',
        metadata: user
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách người dùng (chỉ admin)
  static async getAllUsers(req, res, next) {
    try {
      const { page, limit, sort, filter } = req.query;
      const users = await UserService.findAllUsers({ 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 20,
        sort: sort || 'ctime',
        filter: filter || {}
      });
      return new OK({
        message: 'Lấy danh sách người dùng thành công',
        metadata: users
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật thông tin người dùng
  static async updateUser(req, res, next) {
    try {
      const userId = req.params.id;
      const dataUpdate = req.body;
      const updatedUser = await UserService.updateUser(userId, dataUpdate);
      return new OK({
        message: 'Cập nhật thông tin người dùng thành công',
        metadata: updatedUser
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Xóa người dùng (chỉ admin)
  static async deleteUser(req, res, next) {
    try {
      const userId = req.params.id;
      const deleted = await UserService.deleteUser(userId);
      return new OK({
        message: 'Xóa người dùng thành công',
        metadata: deleted
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy thông tin profile của người dùng đang đăng nhập
  static async getCurrentUserProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const userWithProfile = await UserService.getUserWithProfile(userId);
      return new OK({
        message: 'Lấy thông tin profile thành công',
        metadata: userWithProfile
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật profile của người dùng
  static async updateUserProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;
      const updatedProfile = await UserService.updateUserProfile(userId, profileData);
      return new OK({
        message: 'Cập nhật profile thành công',
        metadata: updatedProfile
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đổi tên người dùng
   */
  static async changeUserName(req, res, next) {
    try {
      const userId = req.user.userId;
      const { name } = req.body;
      
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return new BadRequestError('Tên người dùng không hợp lệ').send(res);
      }
      
      const updatedUser = await UserService.updateUser(userId, { name: name.trim() });
      
      return new OK({
        message: 'Đổi tên người dùng thành công',
        metadata: updatedUser
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Đổi avatar người dùng
   */
  static async changeUserAvatar(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Kiểm tra file ảnh có tồn tại không
      if (!req.file) {
        return new BadRequestError('Không tìm thấy file ảnh').send(res);
      }
      
      // Xử lý và upload file ảnh
      const avatarUrl = await UserService.uploadUserAvatar(userId, req.file);
      
      return new OK({
        message: 'Cập nhật avatar thành công',
        metadata: { avatarUrl }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Liên kết tài khoản Google
   */
  static async linkGoogleAccount(req, res, next) {
    try {
      const { idToken } = req.body;
      const userId = req.user.userId;

      // Xác thực token Google
      const googleUserData = await GoogleAuthService.verifyGoogleToken(idToken);
      
      // Liên kết tài khoản
      const updatedUser = await UserService.linkGoogleAccount(userId, googleUserData);
      
      return new OK({
        message: 'Liên kết tài khoản Google thành công',
        metadata: updatedUser
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hủy liên kết tài khoản
   */
  static async unlinkProvider(req, res, next) {
    try {
      const { provider } = req.params;
      const userId = req.user.userId;
      
      // Hủy liên kết tài khoản
      const result = await UserService.unlinkProvider(userId, provider);
      
      return new OK({
        message: result.message,
        metadata: { success: true }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
