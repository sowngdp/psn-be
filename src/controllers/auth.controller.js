'use strict';

const UserService = require('../services/user.service');
const { OK, CREATED } = require('../core/success.response');
const { AuthFailureError, BadRequestError } = require('../core/error.response');
const JWT = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION } = require('../config/env');
const crypto = require('crypto');

class AuthController {
  // Đăng ký tài khoản mới
  static async signUp(req, res, next) {
    try {
      const { name, email, password, phoneNumber } = req.body;
      
      // Kiểm tra dữ liệu đầu vào
      if (!name || !email || !password) {
        throw new BadRequestError('Thiếu thông tin đăng ký');
      }
      
      // Tạo tài khoản mới
      const newUser = await UserService.createUser({
        name,
        email,
        password,
        phoneNumber
      });
      
      return new CREATED({
        message: 'Đăng ký thành công',
        metadata: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email
          }
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
      
      // Kiểm tra dữ liệu đầu vào
      if (!email || !password) {
        throw new BadRequestError('Email và mật khẩu là bắt buộc');
      }
      
      // Xác thực đăng nhập
      const { user, tokens } = await UserService.login({ email, password });
      
      // Cập nhật thời gian đăng nhập cuối
      await UserService.updateLastLogin(user._id);
      
      return new OK({
        message: 'Đăng nhập thành công',
        metadata: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            roles: user.roles
          },
          tokens
        }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  // Đăng xuất
  static async logout(req, res, next) {
    try {
      // Logic để đánh dấu token hiện tại là không hợp lệ có thể được triển khai ở đây
      // Ví dụ: Thêm token hiện tại vào blacklist trong Redis hoặc DB
      
      return new OK({
        message: 'Đăng xuất thành công'
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  // Làm mới token
  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new BadRequestError('Refresh token là bắt buộc');
      }
      
      // Xác thực refresh token
      const decoded = JWT.verify(refreshToken, JWT_REFRESH_SECRET);
      
      // Tạo token mới
      const accessToken = JWT.sign(
        { userId: decoded.userId, roles: decoded.roles },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      );
      
      return new OK({
        message: 'Làm mới token thành công',
        metadata: { accessToken }
      }).send(res);
    } catch (error) {
      if (error instanceof JWT.TokenExpiredError) {
        next(new AuthFailureError('Refresh token đã hết hạn'));
      } else if (error instanceof JWT.JsonWebTokenError) {
        next(new AuthFailureError('Refresh token không hợp lệ'));
      } else {
        next(error);
      }
    }
  }
  
  // Yêu cầu đặt lại mật khẩu
  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new BadRequestError('Email là bắt buộc');
      }
      
      // Tạo token đặt lại mật khẩu
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = Date.now() + 3600000; // 1 giờ
      
      // Lưu token vào cơ sở dữ liệu
      await UserService.setResetPasswordToken(email, resetToken, resetExpires);
      
      // Gửi email với token (mock, cần triển khai email service thực tế)
      console.log(`Reset token for ${email}: ${resetToken}`);
      
      return new OK({
        message: 'Gửi yêu cầu đặt lại mật khẩu thành công'
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
  
  // Đặt lại mật khẩu
  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        throw new BadRequestError('Token và mật khẩu mới là bắt buộc');
      }
      
      // Đặt lại mật khẩu
      await UserService.resetPassword(token, password);
      
      return new OK({
        message: 'Đặt lại mật khẩu thành công'
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController; 