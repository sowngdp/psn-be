'use strict';
const JWT = require('jsonwebtoken');
const { AuthFailureError, NotFoundError, ForbiddenError } = require('../../core/error.response');
const TokenService = require('../../services/token.service');
const crypto = require('crypto');
const { config: jwtConfig } = require('../../configs/jwt');

const HEADER = {
  AUTHORIZATION: 'authorization',
  CLIENT_ID: 'x-client-id'
}

/**
 * Tạo cặp token mới
 * @param {Object} payload - Dữ liệu payload
 * @returns {Object} - Cặp token mới
 */
const createTokenPair = async (payload) => {
  try {
    // Sử dụng khóa từ cấu hình
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

/**
 * Middleware xử lý async
 */
const asyncHandler = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  }
}

/**
 * Middleware xác thực chính
 */
const authentication = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers[HEADER.AUTHORIZATION];
    if (!authHeader) {
      throw new AuthFailureError('Không tìm thấy token xác thực');
    }
    
    // Trích xuất token - hỗ trợ cả hai định dạng:
    // 1. Authorization: Bearer <token>
    // 2. authorization: <token>
    let token = authHeader;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    
    try {
      // Xác thực token sử dụng public key
      if (!jwtConfig.keys.public) {
        throw new Error('JWT public key not initialized');
      }
      
      const decoded = JWT.verify(token, jwtConfig.keys.public, {
        algorithms: [jwtConfig.access.algorithm]
      });
      
      // Thêm thông tin người dùng vào request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles
      };
      
      next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      if (error instanceof JWT.TokenExpiredError) {
        throw new AuthFailureError('Token đã hết hạn');
      } else if (error instanceof JWT.JsonWebTokenError) {
        throw new AuthFailureError('Token không hợp lệ');
      } else {
        throw new AuthFailureError('Xác thực token thất bại: ' + error.message);
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware phân quyền
 * @param {Array} roles - Danh sách các roles được phép
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    // Authentication phải chạy trước để đặt req.user
    if (!req.user) {
      throw new AuthFailureError('Người dùng chưa xác thực');
    }
    
    // Lấy roles của người dùng từ payload token
    const userRoles = req.user.roles || [];
    
    // Kiểm tra xem người dùng có role cần thiết không
    const hasRole = userRoles.some(role => roles.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenError('Truy cập bị từ chối: không đủ quyền');
    }
    
    next();
  };
};

/**
 * Xác minh token
 */
const verifyJWT = async (token, keySecret) => {
  return JWT.verify(token, jwtConfig.keys.public, {
    algorithms: [jwtConfig.access.algorithm]
  });
}

module.exports = {
  createTokenPair,
  asyncHandler,
  authentication,
  verifyJWT,
  checkRole
}