'use strict';
const JWT = require('jsonwebtoken');
const { AuthFailureError, NotFoundError } = require('../core/error.response');
const ApiKeyService = require('../services/apiKey.service');
const KeyTokenService = require('../services/keyToken.service');
const { ReasonPhrases } = require('../utils/httpStatusCode');
const apiKeyModel = require('../models/apiKey.model');
const crypto = require('crypto');
const { JWT_SECRET } = require('../config/env');
const User = require('../db/models/user.model');

const HEADER = {
    API_KEY: 'x-api-key',
    CLIENT_ID: 'x-client-id',
    AUTHORIZATION: 'authorization',
    REFRESH_TOKEN: 'x-refresh-token',
}

const createTokenPair = async (payload, publicKey, privateKey) => {
    try {
        //payload là chúng ta sẽ chứa những thông tin vận chuyển mang đi
        //từ hệ thống này qua hệ thống khác thông qua cái token
        const accessToken = await JWT.sign(payload, publicKey, {
            //privatekey k lưu vào DB
            //nó chỉ xảy ra, diễn ra 1 lần khi chúng ta sign up hoặc login thành công thì nó sẽ đẩy qua browser
            //đẩy qua browser thì chúng ta bị nhìn thấy thì sao ?
            //Giải thích: bản thân mình thấy token của mình là chuyện bth, quan trọng là ng khác có lấy cắp đc hay k ?
            expiresIn: '2 days',
        });

        const refreshToken = await JWT.sign(payload, privateKey, {
            expiresIn: '7 days',
        });

        //viet them 1 ham, verify dung publicToken
        JWT.verify(accessToken, publicKey, (err, decode) => {
            if(err){
                console.error(`error verify:`, err);
            } else {
                console.log(`decode verify:`, decode);
            }
        })
        return { accessToken, refreshToken };
    } catch (err) {
        return err
    }
};


const apiKey = async (req, res, next) => {
    try {
        // check key
        const key = req.headers[HEADER.API_KEY]?.toString();
        if (!key) {
            return res.status(403).json({
                message: 'Forbidden Error'
            })
        }
        //check objKey
        const objKey = await ApiKeyService.findById(key);
        if (!objKey) {
            return res.status(403).json({
                message: 'Forbidden Error',
            })
        }
        req.objKey = objKey;
        return next();
    } catch (err) {
        console.log('apiKey function:::', err.message);
    }
}

const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.objKey.permissions) {
            return res.status(403).json({
                message: 'Permission dinied',
            })
        };
        console.log('permissions::', req.objKey.permissions);
        console.log('permissions::ReasonPhrases:::', ReasonPhrases.UNAUTHORIZED);
        const validPermission = req.objKey.permissions.includes(permission); //output true - false
        if (!validPermission) {
            return res.status(403).json({
                message: 'permission denied',
            });
        }
        return next();
    }
};

const asyncHandler = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    }
}

const authentication = async (req, res, next) => {
  // Lấy token từ header
  const token = extractToken(req);
  if (!token) {
    return next(new AuthFailureError('Không tìm thấy token'));
  }
  
  try {
    // Giải mã token
    const decodeUser = JWT.verify(token, JWT_SECRET);
    
    // Tìm kiếm người dùng
    const user = await User.findById(decodeUser.userId);
    if (!user) {
      return next(new NotFoundError('Không tìm thấy người dùng'));
    }
    
    // Gắn thông tin người dùng vào request
    req.user = decodeUser;
    
    return next();
  } catch (error) {
    if (error instanceof JWT.TokenExpiredError) {
      return next(new AuthFailureError('Token đã hết hạn'));
    }
    
    return next(new AuthFailureError('Token không hợp lệ'));
  }
};

// Trích xuất token từ header
const extractToken = (req) => {
  const bearerHeader = req.headers[HEADER.AUTHORIZATION];
  if (bearerHeader) {
    const bearer = bearerHeader.split(' ');
    if (bearer.length === 2 && bearer[0] === 'Bearer') {
      return bearer[1];
    }
  }
  
  return null;
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

const authenticationV3 = async (req, res, next) => {
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
    // check user role
    // check user permission
    return next();
}

const verifyJWT = async (token, keySecret) => {
    const decodeUser = await JWT.verify(token, keySecret);
    return decodeUser;
}



module.exports = {
    createTokenPair,
    apiKey,
    checkPermission,
    asyncHandler,
    authentication,
    verifyJWT,
    authenticationV2,
    HEADER
}