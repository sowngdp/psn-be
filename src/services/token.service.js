'use strict';

const KeyTokenModel = require('../db/models/keytoken.model');
const jwt = require('jsonwebtoken');
const { createTokenPair } = require('../api/middlewares/authentication');
const { AuthFailureError, BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const crypto = require('crypto');
const { config: jwtConfig } = require('../configs/jwt');
const { verifyJwtToken, checkTokenExpiration, hashToken } = require('../utils/security');

class TokenService {
    /**
     * Tạo token mới cho người dùng
     * @param {Object} user - Thông tin người dùng
     * @param {Object} options - Tùy chọn bổ sung (device, ip, userAgent)
     * @returns {Object} tokens - Cặp token mới
     */
    static async generateTokenPair(user, options = {}) {
        // Tạo payload có tính duy nhất cao
        const uniqueTimestamp = Date.now();
        const uniqueRandom = crypto.randomBytes(32).toString('hex');
        const ipPart = (options.ip || "unknown").replace(/[^a-zA-Z0-9]/g, '');
        const deviceHash = options.device ? crypto.createHash('md5').update(JSON.stringify(options.device)).digest('hex').substring(0, 8) : 'nodevice';
        
        const payload = {
            userId: user._id,
            email: user.email,
            roles: user.roles,
            // Thêm thông tin fingerprint để tăng cường bảo mật
            iat: Math.floor(uniqueTimestamp / 1000),
            // JTI đủ phức tạp để tránh va chạm
            jti: `${uniqueRandom}_${uniqueTimestamp}_${ipPart}_${deviceHash}_${Math.random().toString(36).substring(2)}`
        };

        // Thêm fingerprint
        if (options.device || options.ip || options.userAgent) {
            payload.fingerprint = this._generateFingerprint(options);
        }
        
        // Tạo token sử dụng RSA keys từ cấu hình
        const tokens = await createTokenPair(payload);
        
        try {
            // Lưu token trong database cùng với thông tin thiết bị
            const hashedRefreshToken = hashToken(tokens.refreshToken);
            
            // Kiểm tra trùng lặp trước khi lưu
            const existingToken = await KeyTokenModel.findOne({ 
                refreshToken: hashedRefreshToken,
                user: { $ne: user._id } // Chỉ báo lỗi nếu token trùng với user khác
            });
            
            if (existingToken) {
                console.warn(`[WARNING] Token collision detected during token generation for user ${user._id}`);
                // Tạo lại token nếu bị trùng
                return this.generateTokenPair(user, {
                    ...options,
                    retry: (options.retry || 0) + 1
                });
            }
            
            // Cập nhật hoặc tạo mới key token
            await KeyTokenModel.findOneAndUpdate(
                { user: user._id },
                {
                    $set: {
                        refreshToken: hashedRefreshToken,
                        refreshTokensUsed: [],
                        lastRotated: new Date(),
                        originalRefreshTokenHash: crypto.createHash('md5').update(tokens.refreshToken).digest('hex'),
                        ip: options.ip || 'unknown',
                        userAgent: options.userAgent || 'unknown',
                        device: options.device || {}
                    }
                },
                { upsert: true, new: true }
            );
            
            return tokens;
        } catch (error) {
            console.error('Error in generateTokenPair:', error);
            throw error;
        }
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
            device ? JSON.stringify(device) : '',
            Date.now().toString(), // Thêm timestamp chính xác đến millisecond
            Math.random().toString() // Thêm số ngẫu nhiên để tăng tính duy nhất
        ].join('|');
        
        return crypto.createHash('sha256').update(values).digest('hex');
    }
    
    /**
     * Tạo hoặc cập nhật key token với token được hash
     * @param {Object} param0 - Thông tin token và thiết bị
     * @returns {Object} - Key token đã tạo hoặc cập nhật
     */
    static async createOrUpdateKeyToken({ userId, refreshToken, userAgent, ip, device }) {
        try {
            // Hash token trước khi lưu
            const hashedRefreshToken = hashToken(refreshToken);
            
            // Kiểm tra xem đã có key token chưa
            const filter = { user: userId };
            const update = {
                refreshToken: hashedRefreshToken,
                refreshTokensUsed: [],
                lastRotated: new Date(),
                // Lưu trữ token gốc trong một trường riêng để so sánh khi cần
                originalRefreshTokenHash: crypto.createHash('md5').update(refreshToken).digest('hex'),
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
        // Hash token để tìm kiếm
        const hashedRefreshToken = hashToken(refreshToken);
        return await KeyTokenModel.findOne({
            user: userId,
            refreshToken: hashedRefreshToken
        }).lean();
    }
    
    /**
     * Tìm key token theo refresh token
     * @param {String} refreshToken - Refresh token cần tìm
     * @returns {Object} - Key token tìm thấy
     */
    static async findByRefreshToken(refreshToken) {
        // Hash token để tìm kiếm
        const hashedRefreshToken = hashToken(refreshToken);
        return await KeyTokenModel.findOne({ refreshToken: hashedRefreshToken });
    }
    
    /**
     * Cập nhật refresh token và thêm token cũ vào danh sách đã sử dụng (với hash)
     * @param {String} userId - ID của người dùng
     * @param {String} oldRefreshToken - Refresh token cũ
     * @param {String} newRefreshToken - Refresh token mới
     * @param {Object} clientInfo - Thông tin về client (ip, userAgent)
     * @returns {Object} - Key token đã cập nhật
     */
    static async updateRefreshToken(userId, oldRefreshToken, newRefreshToken, clientInfo = {}) {
        // Hash các token
        const hashedOldToken = hashToken(oldRefreshToken);
        const hashedNewToken = hashToken(newRefreshToken);
        
        // Kiểm tra trùng lặp refresh token để ngăn chặn reuse attack
        const existingToken = await KeyTokenModel.findOne({ refreshToken: hashedNewToken });
        if (existingToken) {
            // Log sự cố duplicate token
            this._logSecurityIncident({
                userId,
                ip: clientInfo.ip || 'unknown',
                userAgent: clientInfo.userAgent || 'unknown',
                type: 'duplicate_token',
                details: 'Duplicate token hash detected during token refresh'
            });
            
            throw new AuthFailureError('Token generation error: duplicate token detected');
        }
        
        // Tạo hash ngắn để lưu trong used tokens (tiết kiệm không gian)
        const shortOldTokenHash = crypto.createHash('md5').update(oldRefreshToken).digest('hex');
        
        return await KeyTokenModel.findOneAndUpdate(
            { user: userId, refreshToken: hashedOldToken },
            {
                $set: {
                    refreshToken: hashedNewToken,
                    lastRotated: new Date(),
                    originalRefreshTokenHash: crypto.createHash('md5').update(newRefreshToken).digest('hex'),
                    ip: clientInfo.ip || 'unknown',
                    userAgent: clientInfo.userAgent || 'unknown',
                    device: clientInfo.device || {}
                },
                $push: {
                    refreshTokensUsed: shortOldTokenHash
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
        
        let tokenCollisions = 0;
        
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
            
            // Tạo hash của token để tìm kiếm trong database
            const hashedRefreshToken = hashToken(refreshToken);
            
            // Tạo hash ngắn để so sánh với danh sách đã sử dụng
            const shortTokenHash = crypto.createHash('md5').update(refreshToken).digest('hex');
            
            // Tìm token trong database và kiểm tra
            const foundToken = await KeyTokenModel.findOne({ refreshToken: hashedRefreshToken });
            
            // Nếu không tìm thấy, thử tìm theo token gốc (để xử lý chuyển tiếp)
            if (!foundToken) {
                // Trong quá trình chuyển tiếp, token có thể chưa được hash
                const legacyToken = await KeyTokenModel.findOne({ refreshToken });
                if (!legacyToken) {
                    throw new AuthFailureError('Invalid refresh token. Token not found in database');
                }
                
                // Cập nhật lên định dạng mới
                await KeyTokenModel.updateOne(
                    { _id: legacyToken._id },
                    { $set: { refreshToken: hashedRefreshToken } }
                );
                
                console.log(`Migrated legacy token to hashed format for user ${legacyToken.user}`);
                return this.refreshToken({ refreshToken, ip, userAgent, device }); // Gọi lại hàm sau khi cập nhật
            }
            
            // Kiểm tra xem token đã được sử dụng hay chưa
            // Hỗ trợ cả hai định dạng: hash ngắn và token đầy đủ
            if (foundToken.refreshTokensUsed.includes(shortTokenHash) || 
                foundToken.refreshTokensUsed.includes(refreshToken)) {
                // Xóa tất cả token của người dùng vì có dấu hiệu token bị đánh cắp
                await this.removeKeyByUserId(decoded.userId);
                
                // Tạo bản ghi về hành vi đáng ngờ
                this._logSecurityIncident({
                    userId: decoded.userId,
                    ip,
                    userAgent,
                    type: 'token_reuse',
                    details: 'Refresh token reuse attempt detected'
                });
                
                throw new ForbiddenError('Security violation: token reuse detected. All sessions have been terminated.');
            }
            
            // Kiểm tra thông tin fingerprint (nếu có)
            if (decoded.fingerprint) {
                const currentFingerprint = this._generateFingerprint({ ip, userAgent, device });
                if (decoded.fingerprint !== currentFingerprint) {
                    this._logSecurityIncident({
                        userId: decoded.userId,
                        ip,
                        userAgent,
                        type: 'device_mismatch',
                        details: 'Refresh token used from a different device/IP'
                    });
                }
            }
            
            // Tạo user object từ decoded token
            const user = {
                _id: decoded.userId,
                email: decoded.email,
                roles: decoded.roles
            };
            
            // Trực tiếp cập nhật token - phương pháp mạnh mẽ hơn
            // Không cần kiểm tra trùng lặp vì đang cập nhật token của chính user hiện tại
            try {
                // Tạo token mới
                const tokens = await createTokenPair({
                    userId: user._id,
                    email: user.email,
                    roles: user.roles,
                    iat: Math.floor(Date.now() / 1000),
                    jti: crypto.randomBytes(32).toString('hex') + "_" + Date.now() + "_" + (ip || "unknown").replace(/[^a-zA-Z0-9]/g, '')
                });
                
                // Hash token để lưu vào DB
                const hashedNewToken = hashToken(tokens.refreshToken);
                const shortNewTokenHash = crypto.createHash('md5').update(tokens.refreshToken).digest('hex');
                
                // Cập nhật trực tiếp trong database
                await KeyTokenModel.findOneAndUpdate(
                    { user: user._id },
                    {
                        $set: {
                            refreshToken: hashedNewToken,
                            originalRefreshTokenHash: shortNewTokenHash,
                            lastRotated: new Date(),
                            ip: ip || 'unknown',
                            userAgent: userAgent || 'unknown',
                            device: device || {}
                        },
                        $push: {
                            refreshTokensUsed: shortTokenHash
                        }
                    },
                    { new: true }
                );
                
                return tokens;
            } catch (error) {
                console.error('Error updating token:', error);
                throw new AuthFailureError('Failed to refresh token');
            }
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
     * Thu hồi token (logout) với hash
     * @param {Object} param0 - Thông tin refresh token và client
     * @returns {Object} - Kết quả thu hồi
     */
    static async revokeToken({ refreshToken, ip, userAgent }) {
        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }
        
        // Hash token để tìm kiếm
        const hashedRefreshToken = hashToken(refreshToken);
        const foundToken = await KeyTokenModel.findOne({ refreshToken: hashedRefreshToken });
        if (!foundToken) {
            throw new NotFoundError('Refresh token not found');
        }
        
        // Tạo hash ngắn để lưu trong used tokens
        const shortTokenHash = crypto.createHash('md5').update(refreshToken).digest('hex');
        
        // Thêm token vào danh sách đã sử dụng và xóa refresh token hiện tại
        return await KeyTokenModel.findOneAndUpdate(
            { refreshToken: hashedRefreshToken },
            {
                $set: { 
                    refreshToken: null,
                    revokedAt: new Date(),
                    revokedIp: ip || 'unknown',
                    revokedUserAgent: userAgent || 'unknown'
                },
                $push: { refreshTokensUsed: shortTokenHash }
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
    
    /**
     * Làm sạch các token cũ, đã hết hạn hoặc không sử dụng
     * @returns {Object} - Kết quả làm sạch
     */
    static async cleanupTokens() {
        try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() - 30); // Xóa token cũ hơn 30 ngày
            
            // Xóa các token đã bị thu hồi hoặc cũ
            const revokedResult = await KeyTokenModel.deleteMany({
                $or: [
                    { refreshToken: null, revokedAt: { $lt: expiryDate } },
                    { lastRotated: { $lt: expiryDate } }
                ]
            });
            
            // Xóa danh sách refreshTokensUsed cũ
            const updatedResult = await KeyTokenModel.updateMany(
                { 'refreshTokensUsed.0': { $exists: true } },
                { 
                    $set: { 
                        refreshTokensUsed: [] 
                    }
                }
            );
            
            return {
                tokensDeleted: revokedResult.deletedCount,
                tokensUpdated: updatedResult.modifiedCount
            };
        } catch (error) {
            console.error('Error cleaning up tokens:', error);
            throw error;
        }
    }
}

// Lịch trình làm sạch token định kỳ
let cleanupScheduled = false;

// Khởi tạo lịch trình làm sạch token
const initTokenCleanupSchedule = () => {
    if (cleanupScheduled) return;
    
    // Làm sạch token hết hạn mỗi 24 giờ
    const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 giờ
    
    setInterval(async () => {
        try {
            console.log('Running scheduled token cleanup...');
            const result = await TokenService.cleanupTokens();
            console.log('Token cleanup completed:', result);
        } catch (error) {
            console.error('Error in scheduled token cleanup:', error);
        }
    }, CLEANUP_INTERVAL);
    
    cleanupScheduled = true;
    console.log('Token cleanup schedule initialized');
};

// Tự động khởi tạo lịch trình làm sạch
initTokenCleanupSchedule();

module.exports = TokenService; 