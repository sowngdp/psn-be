'use strict';

const BaseRepository = require('./base.repository');
const KeyToken = require('../models/keytoken.model');

/**
 * Repository chuyên biệt cho KeyToken model
 * @class KeyTokenRepository
 * @extends BaseRepository
 */
class KeyTokenRepository extends BaseRepository {
  constructor() {
    super(KeyToken);
  }

  /**
   * Tìm token theo userId
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Document|null>} KeyToken nếu tìm thấy, null nếu không
   */
  async findByUserId(userId) {
    return this.findOne({ user: userId });
  }

  /**
   * Tìm token theo refreshToken
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Document|null>} KeyToken nếu tìm thấy, null nếu không
   */
  async findByRefreshToken(refreshToken) {
    return this.findOne({ refreshToken });
  }

  /**
   * Tìm token theo refreshTokensUsed
   * @param {string} refreshToken - Refresh token đã sử dụng
   * @returns {Promise<Document|null>} KeyToken nếu tìm thấy, null nếu không
   */
  async findByRefreshTokenUsed(refreshToken) {
    return this.findOne({ refreshTokensUsed: refreshToken });
  }

  /**
   * Xóa token theo userId
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Object>} Kết quả xóa
   */
  async removeByUserId(userId) {
    return this.deleteMany({ user: userId });
  }

  /**
   * Thêm refreshToken vào mảng refreshTokensUsed
   * @param {string} id - ID của KeyToken
   * @param {string} refreshToken - Refresh token cần thêm vào mảng đã sử dụng
   * @returns {Promise<Document|null>} KeyToken đã cập nhật hoặc null nếu không tìm thấy
   */
  async addRefreshTokenUsed(id, refreshToken) {
    return this.model.findByIdAndUpdate(
      id,
      { 
        $push: { refreshTokensUsed: refreshToken } 
      },
      { new: true }
    );
  }

  /**
   * Cập nhật refreshToken mới
   * @param {string} id - ID của KeyToken
   * @param {string} oldRefreshToken - Refresh token cũ
   * @param {string} newRefreshToken - Refresh token mới
   * @returns {Promise<Document|null>} KeyToken đã cập nhật hoặc null nếu không tìm thấy
   */
  async updateRefreshToken(id, oldRefreshToken, newRefreshToken) {
    return this.model.findByIdAndUpdate(
      id,
      { 
        refreshToken: newRefreshToken,
        $push: { refreshTokensUsed: oldRefreshToken } 
      },
      { new: true }
    );
  }
}

module.exports = new KeyTokenRepository(); 