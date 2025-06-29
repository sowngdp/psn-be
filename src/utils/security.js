'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Tạo mã ngẫu nhiên với độ dài cho trước
 * @param {number} length - Độ dài của mã
 * @returns {string} - Mã ngẫu nhiên
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash một chuỗi sử dụng SHA-256
 * @param {string} token - Chuỗi cần hash
 * @returns {string} - Chuỗi đã hash
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Tạo ID duy nhất cho request/session
 * @returns {string} - ID duy nhất
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Kiểm tra độ mạnh của mật khẩu
 * @param {string} password - Mật khẩu cần kiểm tra
 * @returns {Object} - Kết quả kiểm tra với score và các gợi ý
 */
const checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  // Kiểm tra độ dài
  if (password.length < 8) {
    feedback.push('Mật khẩu nên có ít nhất 8 ký tự');
  } else {
    score += 1;
  }

  // Kiểm tra chữ hoa
  if (!/[A-Z]/.test(password)) {
    feedback.push('Nên có ít nhất một chữ hoa');
  } else {
    score += 1;
  }

  // Kiểm tra chữ thường
  if (!/[a-z]/.test(password)) {
    feedback.push('Nên có ít nhất một chữ thường');
  } else {
    score += 1;
  }

  // Kiểm tra số
  if (!/[0-9]/.test(password)) {
    feedback.push('Nên có ít nhất một chữ số');
  } else {
    score += 1;
  }

  // Kiểm tra ký tự đặc biệt
  if (!/[^A-Za-z0-9]/.test(password)) {
    feedback.push('Nên có ít nhất một ký tự đặc biệt');
  } else {
    score += 1;
  }

  // Đánh giá độ mạnh
  let strength = 'yếu';
  if (score >= 5) {
    strength = 'mạnh';
  } else if (score >= 3) {
    strength = 'trung bình';
  }

  return {
    score,
    strength,
    feedback
  };
};

/**
 * Làm sạch dữ liệu nhạy cảm từ đối tượng
 * @param {Object} obj - Đối tượng cần làm sạch
 * @param {Array} sensitiveFields - Danh sách các trường nhạy cảm
 * @returns {Object} - Đối tượng đã được làm sạch
 */
const sanitizeObject = (obj, sensitiveFields = ['password', 'token', 'secret']) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (field in result) {
      delete result[field];
    }
  });
  
  return result;
};

/**
 * Kiểm tra token JWT có hợp lệ về mặt định dạng
 * Lưu ý: Hàm này chỉ kiểm tra định dạng, không xác thực chữ ký
 * @param {string} token - JWT token cần kiểm tra
 * @returns {boolean} - Kết quả kiểm tra
 */
const isValidJwtFormat = (token) => {
  const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*$/;
  return jwtRegex.test(token);
};

/**
 * Trích xuất thông tin từ JWT token
 * Lưu ý: Hàm này chỉ decode, không xác thực chữ ký
 * @param {string} token - JWT token cần decode
 * @returns {Object|null} - Thông tin decoded hoặc null nếu lỗi
 */
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString()
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
};

/**
 * Xác thực JWT token với safe decoding
 * @param {string} token - JWT token cần xác thực
 * @param {string} publicKey - Public key để xác thực
 * @param {Object} options - Tùy chọn xác thực (algorithm, issuer, etc.)
 * @returns {Object|null} - Payload đã xác thực hoặc null nếu không hợp lệ
 */
const verifyJwtToken = (token, publicKey, options = {}) => {
  try {
    if (!isValidJwtFormat(token)) {
      return null;
    }
    
    const defaultOptions = { 
      algorithms: ['RS256'],
      ignoreExpiration: false
    };
    
    return jwt.verify(token, publicKey, { ...defaultOptions, ...options });
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

/**
 * Kiểm tra thời gian hết hạn của token JWT
 * @param {string} token - JWT token cần kiểm tra
 * @returns {Object} - Kết quả bao gồm isExpired và timeLeft (ms)
 */
const checkTokenExpiration = (token) => {
  try {
    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) {
      return { isExpired: true, timeLeft: 0 };
    }
    
    const expTimestamp = decoded.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeLeft = expTimestamp - currentTime;
    
    return {
      isExpired: timeLeft <= 0,
      timeLeft: Math.max(0, timeLeft),
      expiresAt: new Date(expTimestamp)
    };
  } catch (error) {
    console.error('Token expiration check error:', error);
    return { isExpired: true, timeLeft: 0 };
  }
};

/**
 * Kiểm tra tính hợp lệ của thông tin trong JWT token
 * @param {Object} payload - JWT payload đã được decode
 * @param {Object} validationRules - Quy tắc xác thực (ví dụ: { requiredFields: ['userId', 'email'] })
 * @returns {boolean} - Kết quả kiểm tra
 */
const validateTokenPayload = (payload, validationRules = {}) => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  // Kiểm tra các trường bắt buộc
  const requiredFields = validationRules.requiredFields || ['userId', 'exp'];
  for (const field of requiredFields) {
    if (payload[field] === undefined) {
      return false;
    }
  }
  
  return true;
};

module.exports = {
  generateRandomToken,
  hashToken,
  generateRequestId,
  checkPasswordStrength,
  sanitizeObject,
  isValidJwtFormat,
  decodeJwt,
  verifyJwtToken,
  checkTokenExpiration,
  validateTokenPayload
}; 