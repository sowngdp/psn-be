'use strict';

const AuthService = require('../../services/auth.service');
const TokenService = require('../../services/token.service');
const { OK, CREATED } = require('../../core/success.response');
const { BadRequestError } = require('../../core/error.response');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const newUser = await AuthService.signUp({ name, email, password });
      
      return new CREATED({
        message: 'Đăng ký tài khoản thành công',
        metadata: {
          user: newUser,
        }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static async registerAdminAccount(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const newUser = await AuthService.signUpAdmin({ name, email, password });

      return new CREATED({
        message: 'Đăng ký tài khoản thành công',
        metadata: {
          user: newUser,
        }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userCredentials = await AuthService.login({ email, password, ip });
      
      return new OK({
        message: 'Đăng nhập thành công',
        metadata: userCredentials
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const tokens = await TokenService.refreshToken({ refreshToken, ip });
      
      return new OK({
        message: 'Làm mới token thành công',
        metadata: tokens
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new BadRequestError('Refresh token là bắt buộc');
      }
      
      const ip = req.ip || req.connection.remoteAddress;
      
      const result = await AuthService.logout({ 
        refreshToken,
        ip
      });
      
      return new OK({
        message: 'Đăng xuất thành công',
        metadata: { success: true }
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset({ email });
      
      return new OK({
        message: 'Đã gửi yêu cầu đặt lại mật khẩu',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword({ token, password });
      
      return new OK({
        message: 'Đặt lại mật khẩu thành công',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController; 
