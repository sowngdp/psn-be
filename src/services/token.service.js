'use strict';

const KeyTokenModel = require('../db/models/keytoken.model');
const jwt = require('jsonwebtoken');
const { createTokenPair } = require('../api/middlewares/authentication');
const { AuthFailureError, BadRequestError, NotFoundError } = require('../core/error.response');
const crypto = require('crypto');
const { config: jwtConfig } = require('../configs/jwt');

class TokenService {
    /**
     * Tạo token mới cho người dùng
     * @param {Object} user - Thông tin người dùng
     * @returns {Object} tokens - Cặp token mới
     */
    static async generateTokenPair(user) {
        // Tạo payload
        const payload = {
            userId: user._id,
            email: user.email,
            roles: user.roles
        };
        
        // Tạo token sử dụng RSA keys từ database
        const tokens = await createTokenPair(payload);
        
        // Lưu token trong database
        await this.createOrUpdateKeyToken({
            userId: user._id,
            refreshToken: tokens.refreshToken
        });
        
        return tokens;
    }
    
    /**
     * Tạo hoặc cập nhật key token
     * @param {Object} param0 - Thông tin token
     * @returns {Object} - Key token đã tạo hoặc cập nhật
     */
    static async createOrUpdateKeyToken({ userId, refreshToken }) {
        try {
            // Kiểm tra xem đã có key token chưa
            const filter = { user: userId };
            const update = {
                refreshToken,
                refreshTokensUsed: [],
                lastRotated: new Date()
            };
            
            // Tìm và cập nhật hoặc tạo mới (upsert)
            const options = {
                upsert: true,
                new: true
            };
            
            const keyToken = await KeyTokenModel.findOneAndUpdate(filter, update, options);
            return keyToken;
        } catch (error) {
            console.error('Error in createOrUpdateKeyToken:', error);
            throw error;
        }
    }
    
    /**
     * Tìm key token theo user ID
     * @param {String} userId - ID của người dùng
     * @returns {Object} - Key token tìm thấy
     */
    static async findByUserId(userId) {
        return await KeyTokenModel.findOne({ user: userId });
    }
    
    /**
     * Tìm key token theo user ID và refresh token
     * @param {String} userId - ID của người dùng
     * @param {String} refreshToken - Refresh token cần kiểm tra
     * @returns {Object} - Key token tìm thấy
     */
    static async findByUserIdAndRefreshToken(userId, refreshToken) {
        return await KeyTokenModel.findOne({
            user: userId,
            refreshToken
        }).lean();
    }
    
    /**
     * Tìm key token theo refresh token
     * @param {String} refreshToken - Refresh token cần tìm
     * @returns {Object} - Key token tìm thấy
     */
    static async findByRefreshToken(refreshToken) {
        return await KeyTokenModel.findOne({ refreshToken });
    }
    
    /**
     * Cập nhật refresh token
     * @param {String} userId - ID của người dùng
     * @param {String} oldRefreshToken - Refresh token cũ
     * @param {String} newRefreshToken - Refresh token mới
     * @returns {Object} - Key token đã cập nhật
     */
    static async updateRefreshToken(userId, oldRefreshToken, newRefreshToken) {
        return await KeyTokenModel.findOneAndUpdate(
            { user: userId, refreshToken: oldRefreshToken },
            {
                $set: {
                    refreshToken: newRefreshToken,
                    lastRotated: new Date()
                },
                $push: {
                    refreshTokensUsed: oldRefreshToken
                }
            },
            { new: true }
        );
    }
    
    /**
     * Xóa key token theo ID
     * @param {String} id - ID của key token
     * @returns {Object} - Kết quả xóa
     */
    static async removeKeyById(id) {
        return await KeyTokenModel.findByIdAndDelete(id);
    }
    
    /**
     * Xóa key token theo user ID
     * @param {String} userId - ID của người dùng
     * @returns {Object} - Kết quả xóa
     */
    static async removeKeyByUserId(userId) {
        return await KeyTokenModel.findOneAndDelete({ user: userId });
    }
    
    /**
     * Làm mới token
     * @param {Object} param0 - Thông tin refresh token
     * @returns {Object} - Cặp token mới
     */
    static async refreshToken({ refreshToken, ip }) {
        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }
        
        try {
            // Verify refresh token sử dụng public key từ database
            if (!jwtConfig.keys.public) {
                throw new Error('JWT public key not initialized');
            }
            
            const decoded = jwt.verify(refreshToken, jwtConfig.keys.public, {
                algorithms: [jwtConfig.refresh.algorithm]
            });
            
            // Tìm token trong database
            const foundToken = await this.findByRefreshToken(refreshToken);
            if (!foundToken) {
                throw new AuthFailureError('Invalid refresh token');
            }
            
            // Kiểm tra xem token đã được sử dụng hay chưa
            if (foundToken.refreshTokensUsed.includes(refreshToken)) {
                // Xóa tất cả token của người dùng vì có dấu hiệu token bị đánh cắp
                await this.removeKeyByUserId(decoded.userId);
                throw new AuthFailureError('Token reuse detected. All sessions have been terminated.');
            }
            
            // Tạo tokens mới
            const user = {
                _id: decoded.userId,
                email: decoded.email,
                roles: decoded.roles
            };
            
            const tokens = await this.generateTokenPair(user);
            
            // Cập nhật refresh token trong database
            await this.updateRefreshToken(decoded.userId, refreshToken, tokens.refreshToken);
            
            return tokens;
        } catch (error) {
            console.error('Refresh token error:', error);
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthFailureError('Refresh token expired');
            }
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthFailureError('Invalid refresh token format');
            }
            throw error;
        }
    }
    
    /**
     * Thu hồi refresh token
     * @param {Object} param0 - Thông tin refresh token
     * @returns {Object} - Kết quả thu hồi
     */
    static async revokeToken({ refreshToken, ip }) {
        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }
        
        const foundToken = await this.findByRefreshToken(refreshToken);
        if (!foundToken) {
            throw new NotFoundError('Refresh token not found');
        }
        
        // Thêm token vào danh sách đã sử dụng và xóa refresh token hiện tại
        return await KeyTokenModel.findOneAndUpdate(
            { refreshToken },
            {
                $set: { refreshToken: null },
                $push: { refreshTokensUsed: refreshToken }
            },
            { new: true }
        );
    }
}

module.exports = TokenService; 