'use strict';

const keyTokenModel = require('../db/models/key-token.model');
const { Types } = require('mongoose');
const crypto = require('crypto');
const { NotFoundError } = require('../core/error.response');

class KeyTokenService {
    // Tạo cặp khóa RSA thực sự
    static generateKeyPair() {
        // Tạo cặp khóa RSA với độ dài 2048 bit
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        
        return { publicKey, privateKey };
    }
    
    // Tạo khóa mới và lưu vào database
    static async createKeyToken({ userId, refreshToken }) {
        try {
            // Tạo cặp khóa mới
            const { publicKey, privateKey } = this.generateKeyPair();
            
            // Xóa khóa cũ nếu có
            await keyTokenModel.findOneAndDelete({ user: userId });
            
            // Lưu khóa mới vào database
            const keyToken = await keyTokenModel.create({
                user: userId,
                publicKey,
                privateKey,
                refreshTokensUsed: [],
                refreshToken
            });
            
            return { publicKey, privateKey };
        } catch (error) {
            console.error('Lỗi khi tạo keyToken:', error);
            throw error;
        }
    }
    
    static async findByUserIdAndRefreshToken(userId, refreshToken) {
        return await keyTokenModel.findOne({
            user: userId,
            refreshToken
        }).populate('user', 'email roles');
    }
    
    static async updateRefreshToken(userId, oldRefreshToken, newRefreshToken) {
        // Cập nhật và lưu lịch sử refresh token
        return await keyTokenModel.findOneAndUpdate(
            { user: userId, refreshToken: oldRefreshToken },
            { 
                $set: { refreshToken: newRefreshToken },
                $addToSet: { refreshTokensUsed: oldRefreshToken }
            },
            { new: true }
        );
    }
    
    static async removeKeyById(id) {
        return await keyTokenModel.findByIdAndDelete(id);
    }
    
    static async removeKeyByUserId(userId) {
        return await keyTokenModel.findOneAndDelete({ user: userId });
    }
    
    // Kiểm tra xem refresh token đã được sử dụng chưa
    static async findByRefreshTokenUsed(refreshToken) {
        return await keyTokenModel.findOne({
            refreshTokensUsed: refreshToken
        });
    }
    
    static async rotateKeys(userId) {
        try {
            // Tìm keyToken hiện tại
            const currentKeyToken = await keyTokenModel.findOne({ user: userId });
            if (!currentKeyToken) {
                throw new NotFoundError('Không tìm thấy key token');
            }
            
            // Tạo cặp khóa mới
            const { publicKey, privateKey } = this.generateKeyPair();
            
            // Lưu khóa mới, giữ nguyên refreshToken
            currentKeyToken.publicKey = publicKey;
            currentKeyToken.privateKey = privateKey;
            currentKeyToken.lastRotated = new Date();
            await currentKeyToken.save();
            
            return { publicKey, privateKey };
        } catch (error) {
            console.error('Lỗi khi xoay khóa:', error);
            throw error;
        }
    }
    
    // Có thể tạo hàm kiểm tra nếu khóa cần được làm mới
    static async shouldRotateKeys(userId) {
        const keyToken = await keyTokenModel.findOne({ user: userId });
        if (!keyToken) return true;
        
        // Kiểm tra thời gian từ lần làm mới cuối
        const lastRotated = new Date(keyToken.lastRotated);
        const now = new Date();
        const daysSinceLastRotation = (now - lastRotated) / (1000 * 60 * 60 * 24);
        
        // Làm mới khóa sau 30 ngày
        return daysSinceLastRotation > 30;
    }
    
    static async createOrUpdateKeyToken({ userId, refreshToken }) {
        try {
            // Generate new key pair
            const publicKey = crypto.randomBytes(64).toString('hex');
            const privateKey = crypto.randomBytes(64).toString('hex');
            
            // Check if a key token already exists
            const keyToken = await keyTokenModel.findOne({ user: userId });
            
            if (keyToken) {
                // Update existing token
                keyToken.publicKey = publicKey;
                keyToken.privateKey = privateKey;
                keyToken.refreshToken = refreshToken;
                keyToken.lastRotated = new Date();
                await keyToken.save();
            } else {
                // Create new token
                await keyTokenModel.create({
                    user: userId,
                    publicKey,
                    privateKey,
                    refreshToken,
                    refreshTokensUsed: [],
                    lastRotated: new Date()
                });
            }
            
            return {
                publicKey,
                privateKey
            };
        } catch (error) {
            console.error('Error in createOrUpdateKeyToken:', error);
            throw error;
        }
    }
}

module.exports = KeyTokenService;
