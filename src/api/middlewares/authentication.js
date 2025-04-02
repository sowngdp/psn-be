'use strict';
const JWT = require('jsonwebtoken');
const { AuthFailureError, NotFoundError } = require('../../core/error.response');
const KeyTokenService = require('../../services/key-token.service');
const { ReasonPhrases } = require('../../utils/httpStatusCode');
const crypto = require('crypto');
const userModel = require('../../db/models/user.model');

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFESHTOKEN: 'x-rtoken-id'
}

const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        // Tạo accessToken với publicKey
        const accessToken = await JWT.sign(payload, privateKey, {
            expiresIn: '2 days',
            algorithm: 'RS256' // Sử dụng thuật toán bất đối xứng
        });

        // Tạo refreshToken với privateKey
        const refreshToken = await JWT.sign(payload, privateKey, {
            expiresIn: '7 days',
            algorithm: 'RS256'
        });

        // Xác minh token với publicKey
        JWT.verify(accessToken, publicKey, (err, decode) => {
            if(err){
                console.error(`error verify:`, err);
            } else {
                console.log(`decode verify:`, decode);
            }
        });
        
        return { accessToken, refreshToken };
    } catch (err) {
        console.error('Lỗi tạo token:', err);
        throw new Error('Không thể tạo token');
    }
};

/**
 * Middleware kiểm tra API Key
 */
const checkApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers[HEADER.API_KEY]?.toString();
    
    if (!apiKey) {
      return res.status(403).json({
        status: 403,
        message: "Forbidden",
        statusText: "API Key is required",
      });
    }

    // Check if the API key is valid
    const objectKey = await apiKeyService.findByID(apiKey);
    if (!objectKey) {
      return res.status(403).json({
        status: 403,
        message: "Forbidden",
        statusText: "API Key is invalid",
      });
    }

    req.objectKey = objectKey;
    return next();

  } catch (error) {
    console.error("Error in checkAuth:", error);
    return res.status(403).json({
      status: 403,
      message: "Forbidden",
    });
  }
};

/**
 * Middleware xác thực quyền truy cập
 */
const verifyPermission = (permission) => {
  return (req, res, next) => {
    if (!req.objectKey || !req.objectKey.permissions) {
      return res.status(403).json({
        status: 403,
        message: "Permission denied",
      });
    }

    const { permissions } = req.objectKey;
    if (!permissions.includes(permission) && !permissions.includes('0000')) {
      return res.status(403).json({
        status: 403,
        message: "Permission denied",
      });
    }

    return next();
  };
};

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
        // Lấy userId từ header
        const userId = req.headers[HEADER.CLIENT_ID];
        if (!userId) throw new AuthFailureError('Invalid Request');

        // Lấy keyStore từ database
        const keyStore = await KeyTokenService.findByUserId(userId);
        if (!keyStore) throw new NotFoundError('Không tìm thấy key');

        // Lấy accessToken từ header
        const accessToken = req.headers[HEADER.AUTHORIZATION];
        if (!accessToken) throw new AuthFailureError('Invalid Request');

        // Xác minh token bằng publicKey từ database
        try {
            const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
            
            // Kiểm tra userId
            if (userId !== decodeUser.userId) {
                throw new AuthFailureError('Invalid UserId');
            }
            
            // Lưu thông tin vào request
            req.keyStore = keyStore;
            req.user = decodeUser;
            
            return next();
        } catch (error) {
            if (error instanceof JWT.TokenExpiredError) {
                throw new AuthFailureError('Token đã hết hạn');
            }
            throw new AuthFailureError('Token không hợp lệ');
        }
    } catch (error) {
        next(error);
    }
};

const authenticationV2 = async (req, res, next) => {
    const userId = req.headers[HEADER.CLIENT_ID];
    if (!userId) throw new AuthFailureError('Invalid Request');
    const keyStore = await KeyTokenService.findByUserId(userId);
    if (!keyStore) throw new NotFoundError('Invalid Request');
    const accessToken = req.headers[HEADER.AUTHORIZATION];
    if(!accessToken) throw new AuthFailureError('Invalid Request');
    console.log('accessToken::::::::::::::', accessToken);
    console.log('keyStore.publicKey::::::::::::::', keyStore.publicKey);
    const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
    if(userId !== decodeUser.userId) throw new AuthFailureError('Invalid UserId');
    req.keyStore = keyStore;
    req.user = decodeUser;
    return next();
}

/**
 * Middleware xác thực cải tiến
 */
const authenticationV3 = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers[HEADER.AUTHORIZATION];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthFailureError('Token không đúng định dạng');
        }
        
        const accessToken = authHeader.split(' ')[1];
        
        // Lấy client ID
        const userId = req.headers[HEADER.CLIENT_ID];
        if (!userId) throw new AuthFailureError('Client ID không tồn tại');
        
        // Tìm key store
        const keyStore = await KeyTokenService.findByUserId(userId);
        if (!keyStore) throw new NotFoundError('Không tìm thấy key store');
        
        try {
            // Verify token
            const decodeUser = JWT.verify(accessToken, keyStore.publicKey);
            
            // Kiểm tra user ID trong token
            if (userId !== decodeUser.userId) {
                throw new AuthFailureError('User ID không khớp');
            }
            
            // Thêm thông tin vào request
            req.keyStore = keyStore;
            req.user = decodeUser;
            
            return next();
        } catch (error) {
            if (error instanceof JWT.TokenExpiredError) {
                throw new AuthFailureError('Token đã hết hạn');
            }
            throw new AuthFailureError('Token không hợp lệ');
        }
    } catch (error) {
        next(error);
    }
};

const verifyJWT = async (token, keySecret) => {
    const decodeUser = await JWT.verify(token, keySecret);
    return decodeUser;
}

module.exports = {
    createTokenPair,
    checkApiKey,
    verifyPermission,
    asyncHandler,
    authentication,
    verifyJWT,
    authenticationV2,
    authenticationV3
}