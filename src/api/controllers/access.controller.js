'use strict';

const AccessService = require('../services/access.service');
const { OK, CREATED } = require('../core/success.response');

class AccessController {
  // Đăng ký người dùng mới
  static async signUp(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const result = await AccessService.signUp({ name, email, password });
      return new CREATED({
        message: 'Đăng ký thành công!',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Đăng nhập
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await AccessService.login({ email, password });
      return new OK({
        message: 'Đăng nhập thành công!',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Đăng xuất
  static async logout(req, res, next) {
    try {
      const { keyStore } = req;
      const result = await AccessService.logout(keyStore);
      return new OK({
        message: 'Đăng xuất thành công!',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Làm mới token
  static async handlerRefreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const { keyStore, user } = req;
      const result = await AccessService.handlerRefreshToken({ refreshToken, keyStore, user });
      return new OK({
        message: 'Làm mới token thành công!',
        metadata: result
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