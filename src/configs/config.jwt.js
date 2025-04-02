// Đặt các cấu hình JWT vào file riêng
module.exports = {
    accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '2 days',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7 days',
    accessTokenAlgorithm: process.env.ACCESS_TOKEN_ALGORITHM || 'RS256',
    refreshTokenAlgorithm: process.env.REFRESH_TOKEN_ALGORITHM || 'RS256',
    jwtSecretKey: process.env.JWT_SECRET_KEY,
    jwtRefreshKey: process.env.JWT_REFRESH_KEY
}; 