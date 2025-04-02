'use strict';

const AccessService = require('../../services/access.service');
const TokenService = require('../../services/token.service');
const { OK, CREATED } = require('../../utils/httpStatusCode');
const { SuccessResponse } = require('../../core/success.response');
const { AuthFailureError } = require('../../core/error.response');
const KeyTokenService = require('../../services/key-token.service');
const { HEADER } = require('../../utils/constants');
const userModel = require('../../db/models/user.model');
const { createTokenPair } = require('../../utils/token');

class AccessController {
  // Đăng ký
  static async signUp(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const newUser = await AccessService.signUp({ name, email, password });
      
      // Tạo token cho user mới
      const tokens = await TokenService.generateTokenPair(newUser);
      
      return new SuccessResponse({
        message: 'Đăng ký thành công',
        metadata: {
          user: {
            userId: newUser._id,
            email: newUser.email,
            name: newUser.name
          },
          tokens
        }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  // Đăng nhập
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const user = await AccessService.login({ email, password });
      
      // Tạo token cho user
      const tokens = await TokenService.generateTokenPair(user);
      
      return new SuccessResponse({
        message: 'Đăng nhập thành công',
        metadata: {
          user: {
            userId: user._id,
            email: user.email,
            name: user.name,
            roles: user.roles
          },
          tokens
        }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  // Làm mới token
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.headers[HEADER.CLIENT_ID];
      
      if (!refreshToken || !userId) {
        throw new AuthFailureError('Refresh token hoặc Client ID không hợp lệ');
      }
      
      // Kiểm tra xem có cần làm mới khóa không
      const needRotation = await KeyTokenService.shouldRotateKeys(userId);
      
      let tokens;
      if (needRotation) {
        // Làm mới khóa và tạo token mới
        const { publicKey, privateKey } = await KeyTokenService.rotateKeys(userId);
        
        // Lấy thông tin người dùng
        const user = await userModel.findById(userId);
        
        // Tạo payload
        const payload = {
          userId: user._id,
          email: user.email,
          roles: user.roles
        };
        
        // Tạo token mới với khóa mới
        tokens = await createTokenPair(payload, publicKey, privateKey);
        
        // Cập nhật refreshToken trong database
        await KeyTokenService.updateRefreshToken(userId, refreshToken, tokens.refreshToken);
      } else {
        // Sử dụng khóa hiện tại
        tokens = await TokenService.refreshToken(refreshToken, userId);
      }
      
      return new SuccessResponse({
        message: 'Làm mới token thành công',
        metadata: tokens
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  // Đăng xuất
  static async logout(req, res, next) {
    try {
      const userId = req.user.userId;
      await TokenService.logout(userId);
      
      return new SuccessResponse({
        message: 'Đăng xuất thành công'
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Đặt lại mật khẩu
  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AccessService.requestPasswordReset(email);
      return new OK({
        message: 'Yêu cầu đặt lại mật khẩu đã được gửi!',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Xác nhận đặt lại mật khẩu
  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await AccessService.resetPassword(token, password);
      return new OK({
        message: 'Đặt lại mật khẩu thành công!',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AccessController;
