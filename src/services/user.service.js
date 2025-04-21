'use strict';

const userModel = require('../db/models/user.model');
const userStyleProfileModel = require('../db/models/user-style-profile.model');
const { BadRequestError, NotFoundError, AuthFailureError, ConflictError } = require('../core/error.response');
const { Types } = require('mongoose');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRATION, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION } = require('../configs/env');

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

  /**
   * Liên kết tài khoản Google cho người dùng
   * @param {string} userId - ID của người dùng
   * @param {Object} googleData - Dữ liệu từ Google OAuth
   * @returns {Object} - Thông tin người dùng đã cập nhật
   */
  static async linkGoogleAccount(userId, googleData) {
    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    // Kiểm tra xem googleId đã tồn tại trong hệ thống chưa
    const existingGoogleUser = await userModel.findOne({ googleId: googleData.sub });
    if (existingGoogleUser && !existingGoogleUser._id.equals(user._id)) {
      throw new ConflictError('Tài khoản Google này đã được liên kết với tài khoản khác');
    }

    // Kiểm tra xem người dùng này đã được liên kết với Google chưa
    if (user.googleId) {
      throw new ConflictError('Tài khoản này đã được liên kết với Google');
    }

    // Tiến hành liên kết tài khoản
    user.googleId = googleData.sub;
    user.providerData = {
      ...user.providerData,
      google: googleData
    };

    // Lưu avatar từ Google nếu user chưa có avatar
    if (!user.avatar && googleData.picture) {
      user.avatar = googleData.picture;
    }

    // Nếu email của user và email Google khác nhau, lưu lại để tham khảo
    if (user.email !== googleData.email) {
      user.providerData.google.alternateEmail = googleData.email;
    }

    // Lưu lại thay đổi
    await user.save();

    // Trả về thông tin user (không bao gồm password)
    const userWithoutPassword = { ...user.toObject() };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  /**
   * Hủy liên kết tài khoản với provider (Google, Apple)
   * @param {string} userId - ID của người dùng
   * @param {string} provider - Tên provider ('google', 'apple')
   * @returns {Object} - Kết quả hủy liên kết
   */
  static async unlinkProvider(userId, provider) {
    // Kiểm tra provider hợp lệ
    if (provider !== 'google' && provider !== 'apple') {
      throw new BadRequestError('Provider không hợp lệ');
    }

    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    // Kiểm tra xem có provider để unlink không
    const providerId = provider === 'google' ? 'googleId' : 'appleId';
    if (!user[providerId]) {
      throw new BadRequestError(`Tài khoản này chưa được liên kết với ${provider}`);
    }

    // Kiểm tra xem có mật khẩu không (nếu không có thì không thể unlink)
    if (!user.password) {
      throw new BadRequestError(`Không thể hủy liên kết khi chưa thiết lập mật khẩu. Vui lòng thiết lập mật khẩu trước.`);
    }

    // Hủy liên kết
    const updateData = {
      [providerId]: null
    };

    // Xóa dữ liệu provider từ providerData
    if (user.providerData && user.providerData[provider]) {
      const providerData = { ...user.providerData };
      delete providerData[provider];
      updateData.providerData = providerData;
    }

    // Cập nhật người dùng
    await userModel.findByIdAndUpdate(userId, { $set: updateData });

    return { success: true, message: `Đã hủy liên kết với ${provider}` };
  }
}

module.exports = UserService; 
