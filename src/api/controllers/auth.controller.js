'use strict';

const AccessService = require('../../services/access.service');
const { OK, CREATED } = require('../../core/success.response');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const newUser = await AccessService.signUp({ name, email, password });
      
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
      const newUser = await AccessService.signUpAdmin({ name, email, password });

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
      const userCredentials = await AccessService.login({ email, password });
      
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
      const tokens = await AccessService.refreshToken({ refreshToken });
      
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
      const result = await AccessService.logout({ refreshToken });
      
      return new OK({
        message: 'Đăng xuất thành công',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  static async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AccessService.requestPasswordReset({ email });
      
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
      const result = await AccessService.resetPassword({ token, password });
      
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
