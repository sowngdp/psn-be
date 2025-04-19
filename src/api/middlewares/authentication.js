'use strict';
const JWT = require('jsonwebtoken');
const { AuthFailureError, NotFoundError, ForbiddenError } = require('../../core/error.response');
const TokenService = require('../../services/token.service');
const crypto = require('crypto');
const { config: jwtConfig } = require('../../configs/jwt');
const { isValidJwtFormat, verifyJwtToken, checkTokenExpiration } = require('../../utils/security');
const { StatusCodes } = require('../../utils/httpStatusCode');

const HEADER = {
  AUTHORIZATION: 'authorization',
  CLIENT_ID: 'x-client-id',
  REFRESH_TOKEN: 'x-refresh-token'
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
 * Middleware xác thực chính - cải tiến với kiểm tra bảo mật cao hơn
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
    
    // Kiểm tra format token
    if (!isValidJwtFormat(token)) {
      throw new AuthFailureError('Token không đúng định dạng');
    }
    
    // Lấy thông tin client để kiểm tra
    const clientInfo = extractClientInfo(req);
    
    try {
      // Xác thực token sử dụng utility từ security.js
      if (!jwtConfig.keys.public) {
        throw new Error('JWT public key not initialized');
      }
      
      const decoded = verifyJwtToken(token, jwtConfig.keys.public, {
        algorithms: [jwtConfig.access.algorithm]
      });
      
      if (!decoded) {
        throw new AuthFailureError('Token không hợp lệ');
      }
      
      // Kiểm tra thời hạn token
      const { isExpired, timeLeft } = checkTokenExpiration(token);
      if (isExpired) {
        throw new AuthFailureError('Token đã hết hạn');
      }
      
      // Thêm thông tin người dùng vào request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        roles: decoded.roles || []
      };
      
      // Nếu token sắp hết hạn, thêm header thông báo
      if (timeLeft && timeLeft < 5 * 60 * 1000) { // Dưới 5 phút
        res.setHeader('X-Token-Expiring-Soon', 'true');
        res.setHeader('X-Token-Expires-In', Math.floor(timeLeft / 1000)); // Số giây còn lại
      }
      
      // Kiểm tra fingerprint (nếu có) để ngăn chặn token stealing
      if (decoded.fingerprint) {
        const currentFingerprint = TokenService._generateFingerprint(clientInfo);
        // Có thể dùng cách tính toán khác cho mức độ nghiêm ngặt phù hợp
        // Ví dụ: so sánh một phần thay vì toàn bộ fingerprint
        if (decoded.fingerprint !== currentFingerprint) {
          console.warn(`[SECURITY] Fingerprint mismatch for user ${decoded.userId}`, {
            expected: decoded.fingerprint,
            received: currentFingerprint,
            ip: clientInfo.ip,
            userAgent: clientInfo.userAgent
          });
          
          // Có thể cho phép tiếp tục nhưng log cảnh báo, hoặc từ chối truy cập tùy theo mức độ
          // throw new ForbiddenError('Phát hiện dấu hiệu token bị lấy cắp');
        }
      }
      
      next();
    } catch (error) {
      console.error('Lỗi xác thực token:', error);
      
      // Xử lý tự động làm mới token nếu cần thiết
      if (shouldAttemptTokenRefresh(error) && req.headers[HEADER.REFRESH_TOKEN]) {
        return await attemptTokenRefresh(req, res, next);
      }
      
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
 * Trích xuất thông tin client từ request
 * @param {Object} req - Express request
 * @returns {Object} - Thông tin client
 */
const extractClientInfo = (req) => {
  return {
    ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    device: {} // Có thể mở rộng để phát hiện thiết bị từ user-agent
  };
};

/**
 * Kiểm tra xem có nên thử làm mới token không
 * @param {Error} error - Lỗi từ quá trình xác thực
 * @returns {boolean} - Có nên thử làm mới token
 */
const shouldAttemptTokenRefresh = (error) => {
  // Chỉ thử làm mới nếu token hết hạn
  return error instanceof JWT.TokenExpiredError;
};

/**
 * Thử làm mới token tự động
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const attemptTokenRefresh = async (req, res, next) => {
  try {
    const refreshToken = req.headers[HEADER.REFRESH_TOKEN];
    if (!refreshToken) {
      throw new AuthFailureError('Refresh token không được cung cấp');
    }
    
    const clientInfo = extractClientInfo(req);
    
    // Gọi service để làm mới token
    const tokens = await TokenService.refreshToken({
      refreshToken,
      ...clientInfo
    });
    
    // Thêm token mới vào response headers
    res.setHeader('X-New-Access-Token', tokens.accessToken);
    
    // Decode token mới để lấy thông tin user
    const decoded = JWT.decode(tokens.accessToken);
    
    // Cập nhật thông tin user trong request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || []
    };
    
    next();
  } catch (error) {
    // Không throw lỗi ở đây - chỉ chuyển tiếp lỗi gốc
    next(error);
  }
};

/**
 * Middleware phân quyền cải tiến
 * @param {Array|Function} roles - Danh sách các roles được phép hoặc hàm kiểm tra quyền
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    try {
      // Authentication phải chạy trước để đặt req.user
      if (!req.user) {
        throw new AuthFailureError('Người dùng chưa xác thực');
      }
      
      // Lấy roles của người dùng từ payload token
      const userRoles = req.user.roles || [];
      
      let hasPermission = false;
      
      // Nếu roles là hàm, gọi hàm để kiểm tra quyền (cho phép logic phức tạp)
      if (typeof roles === 'function') {
        hasPermission = roles(req.user, req);
      } else {
        // Kiểm tra xem người dùng có role cần thiết không
        hasPermission = userRoles.some(role => roles.includes(role));
      }
      
      if (!hasPermission) {
        throw new ForbiddenError('Truy cập bị từ chối: không đủ quyền');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Xác minh token
 */
const verifyJWT = async (token, keySecret) => {
  return verifyJwtToken(token, jwtConfig.keys.public, {
    algorithms: [jwtConfig.access.algorithm]
  });
}

module.exports = {
  createTokenPair,
  asyncHandler,
  authentication,
  verifyJWT,
  checkRole,
  extractClientInfo
}