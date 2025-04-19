'use strict';

const BaseRepository = require('./base.repository');
const User = require('../models/user.model');

/**
 * Repository chuyên biệt cho User model
 * @class UserRepository
 * @extends BaseRepository
 */
class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /**
   * Tìm người dùng theo email
   * @param {string} email - Email của người dùng
   * @returns {Promise<Document|null>} User nếu tìm thấy, null nếu không
   */
  async findByEmail(email) {
    return this.findOne({ email });
  }

  /**
   * Tìm người dùng với role admin
   * @returns {Promise<Document[]>} Mảng các admin users
   */
  async findAdmins() {
    return this.model.find({ roles: 'admin' });
  }

  /**
   * Cập nhật thông tin profile của người dùng
   * @param {string} userId - ID của người dùng
   * @param {Object} profileData - Dữ liệu profile cần cập nhật
   * @returns {Promise<Document|null>} User đã cập nhật hoặc null nếu không tìm thấy
   */
  async updateProfile(userId, profileData) {
    // Lọc ra những trường được phép cập nhật
    const allowedFields = ['name', 'avatar', 'bio', 'preferences'];
    const sanitizedData = {};

    Object.keys(profileData).forEach(key => {
      if (allowedFields.includes(key)) {
        sanitizedData[key] = profileData[key];
      }
    });

    return this.updateById(userId, sanitizedData);
  }

  /**
   * Cập nhật mật khẩu của người dùng
   * @param {string} userId - ID của người dùng
   * @param {string} passwordHash - Mật khẩu đã được hash
   * @returns {Promise<Document|null>} User đã cập nhật hoặc null nếu không tìm thấy
   */
  async updatePassword(userId, passwordHash) {
    return this.updateById(userId, { password: passwordHash });
  }

  /**
   * Thêm role cho người dùng
   * @param {string} userId - ID của người dùng
   * @param {string} role - Role cần thêm
   * @returns {Promise<Document|null>} User đã cập nhật hoặc null nếu không tìm thấy
   */
  async addRole(userId, role) {
    return this.model.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: role } },
      { new: true }
    );
  }

  /**
   * Xóa role của người dùng
   * @param {string} userId - ID của người dùng
   * @param {string} role - Role cần xóa
   * @returns {Promise<Document|null>} User đã cập nhật hoặc null nếu không tìm thấy
   */
  async removeRole(userId, role) {
    return this.model.findByIdAndUpdate(
      userId,
      { $pull: { roles: role } },
      { new: true }
    );
  }

  /**
   * Cập nhật trạng thái hoạt động của người dùng
   * @param {string} userId - ID của người dùng
   * @param {boolean} isActive - Trạng thái hoạt động mới
   * @returns {Promise<Document|null>} User đã cập nhật hoặc null nếu không tìm thấy
   */
  async updateActiveStatus(userId, isActive) {
    return this.updateById(userId, { isActive });
  }

  /**
   * Cập nhật lần đăng nhập cuối của người dùng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Document|null>} User đã cập nhật hoặc null nếu không tìm thấy
   */
  async updateLastLogin(userId) {
    return this.updateById(userId, { lastLogin: new Date() });
  }
}

module.exports = new UserRepository(); 