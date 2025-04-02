const KeyTokenService = require('./key-token.service');
const { createTokenPair } = require('../api/middlewares/authentication');
const { AuthFailureError } = require('../core/error.response');

class TokenService {
    /**
     * Tạo cặp token mới cho user
     */
    static async generateTokenPair(user) {
        // Tạo cặp khóa mới cho mỗi lần đăng nhập
        const privateKey = crypto.randomBytes(64).toString('hex');
        const publicKey = crypto.randomBytes(64).toString('hex');
        
        // Tạo payload
        const payload = {
            userId: user._id,
            email: user.email,
            roles: user.roles
        };
        
        // Tạo token
        const tokens = await createTokenPair(payload, publicKey, privateKey);
        
        // Lưu key vào database
        await KeyTokenService.createKeyToken({
            userId: user._id,
            publicKey,
            privateKey,
            refreshToken: tokens.refreshToken
        });
        
        return tokens;
    }
    
    /**
     * Làm mới token với refresh token
     */
    static async refreshToken(refreshToken, userId) {
        // Tìm key store
        const foundToken = await KeyTokenService.findByUserIdAndRefreshToken(userId, refreshToken);
        if (!foundToken) {
            throw new AuthFailureError('Refresh token không tồn tại');
        }
        
        try {
            // Verify refresh token
            JWT.verify(refreshToken, foundToken.privateKey);
            
            // Tạo payload mới
            const payload = {
                userId,
                email: foundToken.user.email,
                roles: foundToken.user.roles
            };
            
            // Tạo cặp token mới
            const tokens = await createTokenPair(
                payload, 
                foundToken.publicKey, 
                foundToken.privateKey
            );
            
            // Cập nhật refresh token trong database
            await KeyTokenService.updateRefreshToken(userId, refreshToken, tokens.refreshToken);
            
            return tokens;
        } catch (error) {
            // Xóa token nếu không hợp lệ
            await KeyTokenService.removeKeyById(foundToken._id);
            throw new AuthFailureError('Refresh token không hợp lệ hoặc đã hết hạn');
        }
    }
    
    /**
     * Đăng xuất và vô hiệu hóa token
     */
    static async logout(userId) {
        return await KeyTokenService.removeKeyByUserId(userId);
    }
}

module.exports = TokenService; 