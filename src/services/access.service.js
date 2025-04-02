'use strict';

const userModel = require('../db/models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { BadRequestError, AuthFailureError, ForbiddenError } = require('../core/error.response');
const { JWT_SECRET, JWT_EXPIRATION, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION } = require('../configs/env');
const TokenService = require('../services/key-token.service');
const KeyTokenService = require('../services/key-token.service');

class AccessService {
  static async signUp({ name, email, password }) {
    // Kiểm tra email đã tồn tại chưa
    const holderUser = await userModel.findOne({ email }).lean();
    if (holderUser) {
      throw new BadRequestError('Email đã được đăng ký');
    }

    // Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await userModel.create({
      name,
      email,
      password: passwordHash,
      roles: ['USER'],
      isVerified: true, // Trong môi trường phát triển, đặt là true
    });

    // Không trả về mật khẩu
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  static async signUpAdmin({ name, email, password }) {
    // Kiểm tra email đã tồn tại chưa
    const holderUser = await userModel.findOne({ email }).lean();
    if (holderUser) {
      throw new BadRequestError('Email đã được đăng ký');
    }

    // Mã hóa mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = await userModel.create({
      name,
      email,
      password: passwordHash,
      roles: ['ADMIN'],
      isVerified: true, // Trong môi trường phát triển, đặt là true
    });

    // Không trả về mật khẩu
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  static async login({ email, password }) {
    // Tìm user theo email
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError('Email hoặc mật khẩu không chính xác');
    }

    // Kiểm tra mật khẩu
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new BadRequestError('Email hoặc mật khẩu không chính xác');
    }

    // Kiểm tra trạng thái tài khoản
    if (!user.isVerified) {
      throw new ForbiddenError('Tài khoản chưa được xác thực');
    }

    // Nếu xác thực thành công, tạo cặp khóa mới
    const { publicKey, privateKey } = await KeyTokenService.createKeyToken({ 
      userId: user._id,
      refreshToken: null // Sẽ được cập nhật sau
    });
    
    // Tạo payload
    const payload = {
      userId: user._id,
      email: user.email,
      roles: user.roles
    };
    
    // Tạo token với khóa mới
    const tokens = await this.generateTokens(payload);
    
    // Cập nhật refreshToken trong database
    await KeyTokenService.updateRefreshToken(user._id, null, tokens.refreshToken);
    
    return {
      user,
      tokens
    };
  }

  static async refreshToken({ refreshToken }) {
    if (!refreshToken) {
      throw new BadRequestError('Refresh token là bắt buộc');
    }
    
    try {
      // Xác thực refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      
      // Kiểm tra token trong database
      const foundToken = await TokenService.findRefreshToken(refreshToken);
      if (!foundToken) {
        throw new AuthFailureError('Refresh token không hợp lệ');
      }
      
      // Tạo token mới
      const payload = { userId: decoded.userId, roles: decoded.roles };
      const tokens = await this.generateTokens(payload);
      
      // Xóa refresh token cũ
      await TokenService.removeRefreshToken(refreshToken);
      
      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthFailureError('Refresh token đã hết hạn');
      }
      throw new AuthFailureError('Refresh token không hợp lệ');
    }
  }

  static async logout({ refreshToken }) {
    // Trong phiên bản đơn giản, không cần làm gì với refresh token
    // Trong phiên bản thực tế, cần lưu refresh token vào blacklist hoặc xóa khỏi database
    return { success: true };
  }

  static async requestPasswordReset({ email }) {
    // Tìm user theo email
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError('Email không tồn tại');
    }

    // Tạo reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Lưu token vào database với thời hạn
    const passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 phút
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    // Trong môi trường thực tế, gửi email với link đặt lại mật khẩu
    // Ở đây trả về token để test
    return { resetToken };
  }

  static async resetPassword({ token, password }) {
    // Hash token
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Tìm user với token và thời hạn hợp lệ
    const user = await userModel.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new BadRequestError('Token không hợp lệ hoặc đã hết hạn');
    }

    // Cập nhật mật khẩu mới
    const passwordHash = await bcrypt.hash(password, 10);
    user.password = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { success: true };
  }

  static async generateTokens(payload) {
    const accessToken = jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION || '1h' }
    );
    
    const refreshToken = jwt.sign(
      payload,
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION || '7d' }
    );
    
    // Lưu refresh token vào database (có thể sử dụng Redis cho tốc độ tốt hơn)
    await TokenService.saveRefreshToken(payload.userId, refreshToken);
    
    return { accessToken, refreshToken };
  }
}

module.exports = AccessService;
