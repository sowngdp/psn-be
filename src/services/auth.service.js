'use strict';

const userModel = require('../db/models/user.model');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { BadRequestError, AuthFailureError, ForbiddenError } = require('../core/error.response');
const TokenService = require('./token.service');

class AuthService {
  /**
   * Đăng ký người dùng mới
   * @param {Object} param0 - Thông tin đăng ký
   * @returns {Object} - Thông tin người dùng mới
   */
  static async signUp({ name, email, password }) {
    // Kiểm tra email đã tồn tại chưa
    const holderUser = await userModel.findOne({ email }).lean();
    if (holderUser) {
      throw new BadRequestError('Email đã được đăng ký');
    }

    // Tạo user mới - không hash mật khẩu ở đây, để model middleware xử lý
    const newUser = await userModel.create({
      name,
      email,
      password, // Password sẽ được hash tự động bởi userSchema.pre('save')
      roles: ['USER'],
      isVerified: true, // Trong môi trường phát triển, đặt là true
    });

    // Không trả về mật khẩu
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  /**
   * Đăng ký tài khoản admin
   * @param {Object} param0 - Thông tin đăng ký
   * @returns {Object} - Thông tin người dùng mới
   */
  static async signUpAdmin({ name, email, password }) {
    // Kiểm tra email đã tồn tại chưa
    const holderUser = await userModel.findOne({ email }).lean();
    if (holderUser) {
      throw new BadRequestError('Email đã được đăng ký');
    }

    // Tạo user mới với role ADMIN
    const newUser = await userModel.create({
      name,
      email,
      password, // Password sẽ được hash tự động bởi userSchema.pre('save')
      roles: ['ADMIN'],
      isVerified: true,
    });

    // Không trả về mật khẩu
    const userWithoutPassword = { ...newUser.toObject() };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  /**
   * Đăng nhập
   * @param {Object} param0 - Thông tin đăng nhập
   * @returns {Object} - Thông tin người dùng và token
   */
  static async login({ email, password, ip }) {
    // Tìm user theo email
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError('Email hoặc mật khẩu không chính xác');
    }

    // Sử dụng phương thức comparePassword của model
    const match = await user.comparePassword(password);
    if (!match) {
      throw new BadRequestError('Email hoặc mật khẩu không chính xác');
    }

    // Kiểm tra trạng thái tài khoản
    if (!user.isVerified) {
      throw new ForbiddenError('Tài khoản chưa được xác thực');
    }
    
    // Update last login time
    user.lastLogin = new Date();
    await user.save();
    
    // Tạo tokens
    const tokens = await TokenService.generateTokenPair(user);
    
    // Return user info and tokens
    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;
    
    return {
      user: userWithoutPassword,
      tokens
    };
  }

  /**
   * Đăng xuất
   * @param {Object} param0 - Thông tin đăng xuất
   * @returns {Object} - Kết quả đăng xuất
   */
  static async logout({ refreshToken, ip }) {
    return await TokenService.revokeToken({ refreshToken, ip });
  }

  /**
   * Yêu cầu đặt lại mật khẩu
   * @param {Object} param0 - Thông tin email
   * @returns {Object} - Token đặt lại
   */
  static async requestPasswordReset({ email }) {
    // Tìm user theo email
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new BadRequestError('Email không tồn tại');
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = crypto.randomBytes(40).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Lưu token với thời hạn ngắn hơn (15 phút)
    const passwordResetExpires = Date.now() + 15 * 60 * 1000;
    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    
    // Ngăn chặn lạm dụng - giới hạn số lần đặt lại
    if (user.passwordResetAttempts > 5) {
      const lastReset = user.passwordResetLastAttempt || 0;
      const hoursPassed = (Date.now() - lastReset) / (60 * 60 * 1000);
      
      if (hoursPassed < 24) {
        throw new BadRequestError('Quá nhiều yêu cầu đặt lại. Vui lòng thử lại sau.');
      } else {
        // Đặt lại bộ đếm sau 24 giờ
        user.passwordResetAttempts = 1;
      }
    }
    
    user.passwordResetLastAttempt = Date.now();
    await user.save();

    // Trong môi trường thực tế, gửi email với link đặt lại
    // return { message: 'Đã gửi email đặt lại mật khẩu' };
    
    // Cho môi trường phát triển, trả về token
    return { resetToken };
  }

  /**
   * Đặt lại mật khẩu
   * @param {Object} param0 - Thông tin đặt lại mật khẩu
   * @returns {Object} - Kết quả đặt lại
   */
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

    // Cập nhật mật khẩu mới - đặt trực tiếp để middleware pre-save xử lý
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { success: true };
  }
}

module.exports = AuthService; 