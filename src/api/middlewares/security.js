'use strict';

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { BadRequestError, TooManyRequestsError } = require('../../core/error.response');
const { extractClientInfo } = require('./authentication');

/**
 * Cấu hình CORS chi tiết
 * @param {Object} options - Tùy chọn CORS
 * @returns {Function} - Middleware CORS đã cấu hình
 */
const setupCors = (options = {}) => {
  const defaultOptions = {
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Refresh-Token', 'X-Client-ID'],
    exposedHeaders: [
      'X-Total-Count', 
      'X-RateLimit-Limit', 
      'X-RateLimit-Remaining', 
      'X-RateLimit-Reset', 
      'X-New-Access-Token', 
      'X-Token-Expiring-Soon', 
      'X-Token-Expires-In'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 giờ
  };

  return cors({
    ...defaultOptions,
    ...options
  });
};

/**
 * Cấu hình Helmet với các header bảo mật
 * @returns {Function} - Middleware Helmet đã cấu hình
 */
const setupHelmet = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com', 'https://firebasestorage.googleapis.com'],
        connectSrc: ["'self'", process.env.API_URL || '*'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 15552000, // 180 ngày
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  });
};

/**
 * Custom middleware để kiểm tra headers and secure request
 */
const securityHeaders = (req, res, next) => {
  // Thêm các security headers bổ sung
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  
  // Ngăn chặn MIME sniffing
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  // Thêm header cache control
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Kiểm tra Content-Type header cho POST, PUT, PATCH requests
  if (
    ['POST', 'PUT', 'PATCH'].includes(req.method) && 
    req.body && 
    !req.is('application/json') && 
    !req.is('multipart/form-data') && 
    !req.is('application/x-www-form-urlencoded')
  ) {
    return next(new BadRequestError('Unsupported Media Type'));
  }
  
  next();
};

/**
 * Middleware để chặn truy cập từ IP cụ thể hoặc quốc gia
 * @param {Object} options - Tùy chọn
 * @param {Array} options.blockedIPs - Danh sách IP bị chặn
 * @param {Array} options.blockedCountries - Danh sách mã quốc gia bị chặn
 * @returns {Function} - Middleware
 */
const ipFilter = ({ blockedIPs = [], blockedCountries = [] } = {}) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Kiểm tra IP có trong danh sách chặn không
    if (blockedIPs.includes(ip)) {
      return next(new ForbiddenError('Access denied from your IP address'));
    }
    
    // Nếu có country code trong header (thông qua proxy như Cloudflare)
    const countryCode = req.headers['cf-ipcountry'] || '';
    if (countryCode && blockedCountries.includes(countryCode.toUpperCase())) {
      return next(new ForbiddenError('Access denied from your country'));
    }
    
    next();
  };
};

/**
 * Middleware để kiểm tra user agent, chặn các bot và crawler độc hại
 */
const userAgentFilter = () => {
  const suspiciousAgents = [
    'zgrab',
    'semrush',
    'censys',
    'nmap',
    'shellshock',
    'apache struts',
    'masscan',
    'python-requests',
    'go-http-client',
    'nessus',
    'nikto',
    'sqlmap',
    'vulnerability',
    'scanner',
    'metasploit'
  ];
  
  return (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    
    // Kiểm tra user agent có chứa chuỗi đáng ngờ
    const isSuspicious = suspiciousAgents.some(agent => 
      userAgent.toLowerCase().includes(agent.toLowerCase())
    );
    
    if (isSuspicious) {
      return next(new ForbiddenError('Access denied'));
    }
    
    next();
  };
};

/**
 * Tạo middleware rate limiter
 * @param {Object} options - Tùy chọn giới hạn
 * @returns {Function} - Express middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 100, // Số lượng requests tối đa
    standardHeaders: true, // Trả về thông tin rate limit qua headers `RateLimit-*`
    legacyHeaders: false, // Tắt headers `X-RateLimit-*`
    // Handler rate limit error tùy chỉnh
    handler: (req, res, next, options) => {
      next(new TooManyRequestsError(`Quá nhiều yêu cầu từ IP của bạn. Vui lòng thử lại sau ${options.windowMs / 60000} phút.`));
    },
    // Keyify được dùng để tạo khóa, mặc định là IP
    keyGenerator: (req) => {
      return req.ip || req.headers['x-forwarded-for'] || 'unknown-ip';
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

/**
 * Rate limiter cho API endpoints thông thường
 */
const standardLimiter = createRateLimiter();

/**
 * Rate limiter nghiêm ngặt cho endpoints nhạy cảm
 */
const strictLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 30 // 30 requests tối đa
});

/**
 * Rate limiter cực kỳ nghiêm ngặt cho các endpoint nhạy cảm nhất 
 * (đăng nhập, đổi mật khẩu, đăng ký, v.v.)
 */
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 10, // 10 requests tối đa
  // Sử dụng kết hợp IP và User-Agent làm khóa
  keyGenerator: (req) => {
    const clientInfo = extractClientInfo(req);
    return `${clientInfo.ip}-${clientInfo.userAgent}`;
  }
});

/**
 * Rate limiter cho các endpoints public
 */
const publicLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200 // 200 requests tối đa
});

/**
 * Xuất tất cả các middleware bảo mật
 */
module.exports = {
  setupCors,
  setupHelmet,
  securityHeaders,
  ipFilter,
  userAgentFilter,
  standardLimiter,
  strictLimiter,
  authLimiter,
  publicLimiter,
  createRateLimiter
}; 