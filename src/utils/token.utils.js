'use strict';

const JWT = require('jsonwebtoken');

/**
 * Tạo cặp token mới
 * @param {Object} payload - Dữ liệu payload
 * @param {Object} jwtConfig - Cấu hình JWT
 * @returns {Object} - Cặp token mới
 */
const createTokenPair = async (payload, jwtConfig) => {
  try {
    if (!jwtConfig.keys.private || !jwtConfig.keys.public) {
      throw new Error('JWT keys not initialized');
    }
    
    const accessToken = JWT.sign(payload, jwtConfig.keys.private, {
      expiresIn: jwtConfig.access.expiration,
      algorithm: jwtConfig.access.algorithm
    });

    const refreshToken = JWT.sign(payload, jwtConfig.keys.private, {
      expiresIn: jwtConfig.refresh.expiration,
      algorithm: jwtConfig.refresh.algorithm
    });
    
    return { accessToken, refreshToken };
  } catch (err) {
    console.error('Lỗi tạo token:', err);
    throw new Error('Không thể tạo token');
  }
};

module.exports = {
  createTokenPair
}; 