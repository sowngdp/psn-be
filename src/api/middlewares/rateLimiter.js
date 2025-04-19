'use strict';

const { createError } = require('../../utils/error');
const { generateRequestId } = require('../../utils/security');

/**
 * Lưu trữ thông tin giới hạn tốc độ cho mỗi địa chỉ IP
 * { [ip]: { count: number, resetAt: Date, requestIds: Set } }
 */
const ipLimiterStore = new Map();

/**
 * Lưu trữ thông tin giới hạn tốc độ cho các route cụ thể
 * { [route]: { [ip]: { count: number, resetAt: Date, requestIds: Set } } }
 */
const routeLimiterStore = new Map();

/**
 * Xóa dữ liệu cache cũ định kỳ
 */
const cleanupInterval = 15 * 60 * 1000; // 15 phút
setInterval(() => {
  const now = Date.now();
  
  // Dọn dẹp ipLimiterStore
  for (const [ip, data] of ipLimiterStore.entries()) {
    if (data.resetAt < now) {
      ipLimiterStore.delete(ip);
    }
  }
  
  // Dọn dẹp routeLimiterStore
  for (const [route, ipMap] of routeLimiterStore.entries()) {
    for (const [ip, data] of ipMap.entries()) {
      if (data.resetAt < now) {
        ipMap.delete(ip);
      }
    }
    
    if (ipMap.size === 0) {
      routeLimiterStore.delete(route);
    }
  }
}, cleanupInterval);

/**
 * Middleware giới hạn tốc độ request toàn cục
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.windowMs - Thời gian (ms) cho cửa sổ giới hạn
 * @param {number} options.max - Số lượng request tối đa trong khoảng thời gian
 * @returns {function} - Express middleware
 */
const globalRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100 } = {}) => {
  return (req, res, next) => {
    // Lấy địa chỉ IP của client
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const requestId = generateRequestId();
    
    // Lưu requestId cho việc debugging
    req.requestId = requestId;
    
    // Kiểm tra và cập nhật thông tin giới hạn
    if (!ipLimiterStore.has(ip)) {
      ipLimiterStore.set(ip, {
        count: 1,
        resetAt: Date.now() + windowMs,
        requestIds: new Set([requestId])
      });
    } else {
      const limiter = ipLimiterStore.get(ip);
      
      // Cập nhật thời gian reset nếu đã hết hạn
      if (limiter.resetAt < Date.now()) {
        limiter.count = 1;
        limiter.resetAt = Date.now() + windowMs;
        limiter.requestIds = new Set([requestId]);
      } else {
        // Tăng số lượng request và kiểm tra giới hạn
        limiter.count += 1;
        limiter.requestIds.add(requestId);
        
        if (limiter.count > max) {
          const secondsToReset = Math.ceil((limiter.resetAt - Date.now()) / 1000);
          
          // Cài đặt header và trả về lỗi
          res.set('Retry-After', secondsToReset.toString());
          res.set('X-RateLimit-Limit', max.toString());
          res.set('X-RateLimit-Remaining', '0');
          res.set('X-RateLimit-Reset', Math.ceil(limiter.resetAt / 1000).toString());
          
          return next(createError(429, `Too many requests, please try again after ${secondsToReset} seconds`));
        }
      }
    }
    
    // Cài đặt header thông tin giới hạn tốc độ
    const limiter = ipLimiterStore.get(ip);
    res.set('X-RateLimit-Limit', max.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, max - limiter.count).toString());
    res.set('X-RateLimit-Reset', Math.ceil(limiter.resetAt / 1000).toString());
    
    next();
  };
};

/**
 * Middleware giới hạn tốc độ cho route cụ thể
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.windowMs - Thời gian (ms) cho cửa sổ giới hạn
 * @param {number} options.max - Số lượng request tối đa trong khoảng thời gian
 * @returns {function} - Express middleware
 */
const routeRateLimiter = ({ windowMs = 60 * 1000, max = 10 } = {}) => {
  return (req, res, next) => {
    // Lấy địa chỉ IP và đường dẫn
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const route = `${req.method}:${req.path}`;
    const requestId = req.requestId || generateRequestId();
    
    // Tạo map cho route nếu chưa tồn tại
    if (!routeLimiterStore.has(route)) {
      routeLimiterStore.set(route, new Map());
    }
    
    const routeMap = routeLimiterStore.get(route);
    
    // Kiểm tra và cập nhật thông tin giới hạn
    if (!routeMap.has(ip)) {
      routeMap.set(ip, {
        count: 1,
        resetAt: Date.now() + windowMs,
        requestIds: new Set([requestId])
      });
    } else {
      const limiter = routeMap.get(ip);
      
      // Cập nhật thời gian reset nếu đã hết hạn
      if (limiter.resetAt < Date.now()) {
        limiter.count = 1;
        limiter.resetAt = Date.now() + windowMs;
        limiter.requestIds = new Set([requestId]);
      } else {
        // Tăng số lượng request và kiểm tra giới hạn
        limiter.count += 1;
        limiter.requestIds.add(requestId);
        
        if (limiter.count > max) {
          const secondsToReset = Math.ceil((limiter.resetAt - Date.now()) / 1000);
          
          // Cài đặt header và trả về lỗi
          res.set('Retry-After', secondsToReset.toString());
          res.set('X-RateLimit-Limit', max.toString());
          res.set('X-RateLimit-Remaining', '0');
          res.set('X-RateLimit-Reset', Math.ceil(limiter.resetAt / 1000).toString());
          
          return next(createError(429, `Route rate limit exceeded, please try again after ${secondsToReset} seconds`));
        }
      }
    }
    
    // Cài đặt header thông tin giới hạn tốc độ
    const limiter = routeMap.get(ip);
    res.set('X-RateLimit-Limit', max.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, max - limiter.count).toString());
    res.set('X-RateLimit-Reset', Math.ceil(limiter.resetAt / 1000).toString());
    
    next();
  };
};

/**
 * Middleware giới hạn tốc độ cho các endpoint xác thực
 * Thiết lập nghiêm ngặt hơn cho các endpoint nhạy cảm
 */
const authRateLimiter = routeRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 phút
  max: 5 // 5 requests trong 10 phút
});

/**
 * Middleware giới hạn tốc độ cho API endpoints
 */
const apiRateLimiter = routeRateLimiter({
  windowMs: 60 * 1000, // 1 phút
  max: 20 // 20 requests trong 1 phút
});

module.exports = {
  globalRateLimiter,
  routeRateLimiter,
  authRateLimiter,
  apiRateLimiter
}; 