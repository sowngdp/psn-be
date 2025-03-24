'use strict';

const userModel = require('../models/models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const KeyTokenService = require('./keyToken.service');
const { createTokenPair, verifyJWT } = require('../auth/authUtils');
const { getInfoData } = require('../utils');
const { BadRequestError, AuthFailureError, ForbiddenError } = require('../core/error.response');

const roleAccount = {
  USER: 'USER',
  WRITER: 'WRITER',
  EDITOR: 'EDITOR',
  ADMIN: 'ADMIN',
};

class AccessService {
  // Đăng ký người dùng mới
  static async signUp({ name, email, password }) {
    // Kiểm tra email đã tồn tại chưa
    const holderUser = await userModel.findOne({ email }).lean();
    if (holderUser) {
      throw new BadRequestError('Email đã được đăng ký!');
    }

    // Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo mới người dùng
    const newUser = await userModel.create({
      name, 
      email, 
      password: passwordHash,
      roles: [roleAccount.USER]
    });

    if (newUser) {
      // Tạo cặp khóa public/private cho token
      const privateKey = crypto.randomBytes(64).toString('hex');
      const publicKey = crypto.randomBytes(64).toString('hex');

      // Tạo token
      const tokens = await createTokenPair({ 
        userId: newUser._id, 
        email 
      }, publicKey, privateKey);

      // Lưu token
      const keyStore = await KeyTokenService.createKeyToken({
        userId: newUser._id,
        publicKey,
        privateKey,
        refreshToken: tokens.refreshToken
      });

      if (!keyStore) {
        throw new BadRequestError('Lỗi khi tạo khóa token!');
      }

      // Trả về thông tin
      return {
        user: getInfoData({
          fields: ['_id', 'name', 'email'],
          object: newUser
        }),
        tokens
      };
    }

    return null;
  }

  // Đăng nhập
  static async login({ email, password }) {
    // Kiểm tra email
    const foundUser = await userModel.findOne({ email });
    if (!foundUser) {
      throw new BadRequestError('Email chưa được đăng ký!');
    }

    // Kiểm tra mật khẩu
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) {
      throw new AuthFailureError('Mật khẩu không chính xác!');
    }

    // Tạo cặp khóa public/private
    const privateKey = crypto.randomBytes(64).toString('hex');
    const publicKey = crypto.randomBytes(64).toString('hex');

    // Tạo token
    const tokens = await createTokenPair({
      userId: foundUser._id,
      email
    }, publicKey, privateKey);

    // Lưu token
    await KeyTokenService.createKeyToken({
      userId: foundUser._id,
      publicKey,
      privateKey,
      refreshToken: tokens.refreshToken
    });

    return {
      user: getInfoData({
        fields: ['_id', 'name', 'email'],
        object: foundUser
      }),
      tokens
    };
  }

  // Đăng xuất
  static async logout(keyStore) {
    const delKey = await KeyTokenService.removeTokenByUserId(keyStore.user);
    return delKey;
  }

  // Làm mới token
  static async handlerRefreshToken({ refreshToken, keyStore, user }) {
    // Kiểm tra token đã được sử dụng trước đó chưa
    const foundToken = await KeyTokenService.findByRefreshTokenUsed(refreshToken);
    if (foundToken) {
      // Phát hiện hành vi tái sử dụng refresh token
      await KeyTokenService.removeTokenByUserId(user.userId);
      throw new ForbiddenError('Phát hiện truy cập không hợp lệ!');
    }

    // Kiểm tra refreshToken có khớp với keyStore không
    if (keyStore.refreshToken !== refreshToken) {
      throw new AuthFailureError('Token không hợp lệ!');
    }

    // Xác thực token
    try {
      const decodeUser = await verifyJWT(refreshToken, keyStore.privateKey);
      if (user.userId !== decodeUser.userId) {
        throw new AuthFailureError('Token không chính xác!');
      }

      // Tạo cặp token mới
      const tokens = await createTokenPair({
        userId: user.userId,
        email: user.email
      }, keyStore.publicKey, keyStore.privateKey);

      // Cập nhật token
      await KeyTokenService.markTokenAsUsed(user.userId, refreshToken);
      await KeyTokenService.updateRefreshToken(user.userId, tokens.refreshToken);

      return {
        user,
        tokens
      };
    } catch (error) {
      throw new AuthFailureError('Token không hợp lệ!');
    }
  }

  // Yêu cầu đặt lại mật khẩu
  static async requestPasswordReset(email) {
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError('Email không tồn tại!');
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = user.generatePasswordReset();
    await user.save();

    // Trong thực tế, bạn sẽ gửi email với token này
    // await sendResetPasswordEmail(user.email, resetToken);

    return {
      message: 'Kiểm tra email của bạn để được hướng dẫn đặt lại mật khẩu'
    };
  }

  // Đặt lại mật khẩu
  static async resetPassword(token, password) {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new BadRequestError('Token không hợp lệ hoặc đã hết hạn!');
    }

    // Mã hóa mật khẩu mới
    const passwordHash = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu và xóa token
    user.password = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return {
      message: 'Mật khẩu đã được đặt lại thành công'
    };
  }
}

module.exports = AccessService;