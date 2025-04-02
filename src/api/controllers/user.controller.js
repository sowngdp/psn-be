'use strict';

const UserService = require('../../services/user.service');
const { OK, CREATED } = require('../../core/success.response');

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
}

module.exports = UserController; 
