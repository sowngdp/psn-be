'use strict';

const KeyTokenModel = require('../db/models/keytoken.model');
const jwt = require('jsonwebtoken');
const { createTokenPair } = require('../api/middlewares/authentication');
const { AuthFailureError, BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const crypto = require('crypto');
const { config: jwtConfig } = require('../configs/jwt');
const { verifyJwtToken, checkTokenExpiration } = require('../utils/security');

class TokenService {
    /**
     * Tạo token mới cho người dùng
     * @param {Object} user - Thông tin người dùng
     * @param {Object} options - Tùy chọn bổ sung (device, ip, userAgent)
     * @returns {Object} tokens - Cặp token mới
     */
    static async generateTokenPair(user, options = {}) {
        // Tạo payload
        const payload = {
            userId: user._id,
            email: user.email,
            roles: user.roles,
            // Thêm thông tin fingerprint để tăng cường bảo mật
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomBytes(16).toString('hex') // JWT ID - unique identifier
        };

        // Nếu có thông tin thiết bị, thêm vào fingerprint
        if (options.device || options.ip || options.userAgent) {
            payload.fingerprint = this._generateFingerprint(options);
        }
        
        // Tạo token sử dụng RSA keys từ cấu hình
        const tokens = await createTokenPair(payload);
        
        // Lưu token trong database cùng với thông tin thiết bị
        await this.createOrUpdateKeyToken({
            userId: user._id,
            refreshToken: tokens.refreshToken,
            userAgent: options.userAgent,
            ip: options.ip,
            device: options.device
        });
        
        return tokens;
    }
    
    /**
     * Tạo fingerprint từ thông tin thiết bị
     * @param {Object} options - Thông tin thiết bị và IP
     * @returns {String} - Fingerprint hash
     * @private
     */
    static _generateFingerprint(options = {}) {
        const { ip, userAgent, device } = options;
        const values = [
            ip || '',
            userAgent || '',
            device ? JSON.stringify(device) : ''
        ].join('|');
        
        return crypto.createHash('sha256').update(values).digest('hex');
    }
    
    /**
     * Tạo hoặc cập nhật key token
     * @param {Object} param0 - Thông tin token và thiết bị
     * @returns {Object} - Key token đã tạo hoặc cập nhật
     */
    static async createOrUpdateKeyToken({ userId, refreshToken, userAgent, ip, device }) {
        try {
            // Kiểm tra xem đã có key token chưa
            const filter = { user: userId };
            const update = {
                refreshToken,
                refreshTokensUsed: [],
                lastRotated: new Date(),
                // Thêm thông tin thiết bị và IP
                userAgent: userAgent || 'unknown',
                ip: ip || 'unknown',
                device: device || {}
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
     * Cập nhật refresh token và thêm token cũ vào danh sách đã sử dụng
     * @param {String} userId - ID của người dùng
     * @param {String} oldRefreshToken - Refresh token cũ
     * @param {String} newRefreshToken - Refresh token mới
     * @param {Object} clientInfo - Thông tin về client (ip, userAgent)
     * @returns {Object} - Key token đã cập nhật
     */
    static async updateRefreshToken(userId, oldRefreshToken, newRefreshToken, clientInfo = {}) {
        // Kiểm tra trùng lặp refresh token để ngăn chặn reuse attack
        const existingToken = await KeyTokenModel.findOne({ refreshToken: newRefreshToken });
        if (existingToken) {
            throw new AuthFailureError('Token generation error: duplicate token detected');
        }
        
        return await KeyTokenModel.findOneAndUpdate(
            { user: userId, refreshToken: oldRefreshToken },
            {
                $set: {
                    refreshToken: newRefreshToken,
                    lastRotated: new Date(),
                    ip: clientInfo.ip || 'unknown',
                    userAgent: clientInfo.userAgent || 'unknown',
                    device: clientInfo.device || {}
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
     * Làm mới token với kiểm tra bảo mật nâng cao
     * @param {Object} param0 - Thông tin refresh token và client
     * @returns {Object} - Cặp token mới
     */
    static async refreshToken({ refreshToken, ip, userAgent, device }) {
        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }
        
        try {
            // Verify refresh token sử dụng public key từ cấu hình
            if (!jwtConfig.keys.public) {
                throw new Error('JWT public key not initialized');
            }
            
            // Sử dụng hàm từ security utils để xác thực token
            const decoded = verifyJwtToken(refreshToken, jwtConfig.keys.public, {
                algorithms: [jwtConfig.refresh.algorithm]
            });
            
            if (!decoded) {
                throw new AuthFailureError('Invalid refresh token');
            }
            
            // Kiểm tra hạn sử dụng
            const { isExpired } = checkTokenExpiration(refreshToken);
            if (isExpired) {
                throw new AuthFailureError('Refresh token has expired');
            }
            
            // Tìm token trong database
            const foundToken = await this.findByRefreshToken(refreshToken);
            if (!foundToken) {
                throw new AuthFailureError('Invalid refresh token. Token not found in database');
            }
            
            // Kiểm tra xem token đã được sử dụng hay chưa
            if (foundToken.refreshTokensUsed.includes(refreshToken)) {
                // Xóa tất cả token của người dùng vì có dấu hiệu token bị đánh cắp
                await this.removeKeyByUserId(decoded.userId);
                
                // Tạo bản ghi về hành vi đáng ngờ (có thể mở rộng với một service riêng)
                this._logSecurityIncident({
                    userId: decoded.userId,
                    ip,
                    userAgent,
                    type: 'token_reuse',
                    details: 'Refresh token reuse attempt detected'
                });
                
                throw new ForbiddenError('Security violation: token reuse detected. All sessions have been terminated.');
            }
            
            // Kiểm tra thông tin fingerprint (nếu có) để ngăn chặn token được sử dụng trên thiết bị khác
            if (decoded.fingerprint) {
                const currentFingerprint = this._generateFingerprint({ ip, userAgent, device });
                // So sánh fingerprint để phát hiện token chuyển thiết bị
                // Có thể thực hiện kiểm tra linh hoạt hơn thay vì yêu cầu trùng khớp chính xác
                if (decoded.fingerprint !== currentFingerprint) {
                    // Log sự kiện đáng ngờ nhưng vẫn cho phép tiếp tục (có thể thay đổi theo chính sách)
                    this._logSecurityIncident({
                        userId: decoded.userId,
                        ip,
                        userAgent,
                        type: 'device_mismatch',
                        details: 'Refresh token used from a different device/IP'
                    });
                    
                    // Mức độ nghiêm ngặt cao hơn có thể ném lỗi ở đây:
                    // throw new ForbiddenError('Security violation: token used from a different device');
                }
            }
            
            // Tạo tokens mới
            const user = {
                _id: decoded.userId,
                email: decoded.email,
                roles: decoded.roles
            };
            
            const tokens = await this.generateTokenPair(user, { ip, userAgent, device });
            
            // Cập nhật refresh token trong database
            await this.updateRefreshToken(
                decoded.userId, 
                refreshToken, 
                tokens.refreshToken,
                { ip, userAgent, device }
            );
            
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
     * Thu hồi token (logout)
     * @param {Object} param0 - Thông tin refresh token và client
     * @returns {Object} - Kết quả thu hồi
     */
    static async revokeToken({ refreshToken, ip, userAgent }) {
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
                $set: { 
                    refreshToken: null,
                    revokedAt: new Date(),
                    revokedIp: ip || 'unknown',
                    revokedUserAgent: userAgent || 'unknown'
                },
                $push: { refreshTokensUsed: refreshToken }
            },
            { new: true }
        );
    }
    
    /**
     * Lưu thông tin về sự cố bảo mật
     * @param {Object} incident - Thông tin sự cố
     * @private
     */
    static _logSecurityIncident(incident) {
        // Hiện tại chỉ log ra console, có thể mở rộng để lưu vào database
        console.warn(`[SECURITY INCIDENT] ${new Date().toISOString()} - ${incident.type}:`, {
            userId: incident.userId,
            ip: incident.ip,
            userAgent: incident.userAgent,
            details: incident.details
        });
        
        // TODO: Thêm lưu vào database hoặc gửi thông báo trong tương lai
    }
}

module.exports = TokenService; 