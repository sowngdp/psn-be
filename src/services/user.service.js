'use strict';

const userModel = require('../models/models/User');
const userStyleProfileModel = require('../models/models/UserStyleProfile');
const { getInfoData } = require('../utils');
const { BadRequestError, NotFoundError, AuthFailureError } = require('../core/error.response');
const { Types } = require('mongoose');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION } = require('../config/env');

class UserService {
  // Tạo người dùng mới
  static async createUser({ name, email, password, phoneNumber }) {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email đã được sử dụng');
    }
    
    // Tạo người dùng mới
    const newUser = await userModel.create({
      name,
      email,
      password, // Password sẽ được hash tự động bởi mongoose middleware
      phoneNumber,
      roles: ['USER']
    });
    
    // Tạo profile style cho người dùng
    await userStyleProfileModel.create({
      userId: newUser._id
    });
    
    return newUser;
  }
  
  // Đăng nhập
  static async login({ email, password }) {
    // Tìm người dùng
    const user = await userModel.findOne({ email });
    if (!user) {
      throw new AuthFailureError('Email hoặc mật khẩu không chính xác');
    }
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthFailureError('Email hoặc mật khẩu không chính xác');
    }
    
    // Tạo token
    const tokens = {
      accessToken: JWT.sign(
        { userId: user._id, roles: user.roles },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
      ),
      refreshToken: JWT.sign(
        { userId: user._id, roles: user.roles },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRATION }
      )
    };
    
    return { user, tokens };
  }
  
  // Cập nhật thời gian đăng nhập cuối
  static async updateLastLogin(userId) {
    await userModel.findByIdAndUpdate(userId, {
      $set: { lastLogin: new Date() }
    });
  }
  
  // Tìm người dùng theo ID
  static async findUserById(userId) {
    const user = await userModel.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    return user;
  }
  
  // Cập nhật thông tin người dùng
  static async updateUser(userId, updateData) {
    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    
    // Không cho phép cập nhật email và roles qua API này
    delete updateData.email;
    delete updateData.roles;
    delete updateData.password;
    
    // Cập nhật thông tin người dùng
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires');
    
    return updatedUser;
  }
  
  // Cập nhật profile người dùng
  static async updateUserProfile(userId, profileData) {
    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');

    // Tìm profile hiện tại
    let styleProfile = await userStyleProfileModel.findOne({ userId: new Types.ObjectId(userId) });

    // Nếu chưa có profile thì tạo mới
    if (!styleProfile) {
      styleProfile = await userStyleProfileModel.create({
        userId: new Types.ObjectId(userId),
        ...profileData
      });
    } else {
      // Cập nhật profile hiện tại
      styleProfile = await userStyleProfileModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: profileData },
        { new: true }
      );
    }

    return styleProfile;
  }
  
  // Lấy danh sách người dùng (admin)
  static async getAllUsers({ page = 1, limit = 20 }) {
    // Chỉ lấy các thông tin cần thiết
    const users = await userModel.find()
      .select('name email phoneNumber status roles lastLogin createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalUsers = await userModel.countDocuments();
    
    return {
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    };
  }
  
  // Xóa người dùng (admin)
  static async deleteUser(userId) {
    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    
    // Xóa người dùng
    await userModel.findByIdAndDelete(userId);
    
    // Xóa profile người dùng
    await userStyleProfileModel.findOneAndDelete({ userId });
    
    return { success: true };
  }
  
  // Đặt token đặt lại mật khẩu
  static async setResetPasswordToken(email, token, expires) {
    const user = await userModel.findOne({ email });
    if (!user) throw new NotFoundError('Không tìm thấy email');
    
    // Cập nhật token đặt lại mật khẩu
    await userModel.findByIdAndUpdate(user._id, {
      $set: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(expires)
      }
    });
    
    return true;
  }
  
  // Đặt lại mật khẩu
  static async resetPassword(token, newPassword) {
    // Tìm người dùng với token hợp lệ
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      throw new BadRequestError('Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn');
    }
    
    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();
    
    return true;
  }
  
  // Tạo các hàm tiện ích
  static getInfoData(object = {}, fields = []) {
    return fields.reduce((obj, field) => {
      if (object && object[field] !== undefined) {
        obj[field] = object[field];
      }
      return obj;
    }, {});
  }
}

module.exports = UserService; 