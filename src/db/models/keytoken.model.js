const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const keyTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    refreshToken: {
        type: String,
        default: null
    },
    refreshTokensUsed: {
        type: [String],
        default: []
    },
    originalRefreshTokenHash: {
        type: String,
        default: null
    },
    lastRotated: {
        type: Date,
        default: Date.now
    },
    revokedAt: {
        type: Date,
        default: null
    },
    revokedIp: {
        type: String,
        default: null
    },
    revokedUserAgent: {
        type: String,
        default: null
    },
    ip: {
        type: String,
        default: 'unknown'
    },
    userAgent: {
        type: String,
        default: 'unknown'
    },
    device: {
        type: Object,
        default: {}
    },
    securityIncidents: {
        type: [{
            type: {
                type: String,
                enum: ['token_reuse', 'device_mismatch', 'duplicate_token', 'token_collision']
            },
            details: String,
            ip: String,
            userAgent: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Đảm bảo các index cho hiệu suất
keyTokenSchema.index({ user: 1 });
keyTokenSchema.index({ refreshToken: 1 });
keyTokenSchema.index({ 'securityIncidents.timestamp': -1 });
keyTokenSchema.index({ lastRotated: -1 });

module.exports = mongoose.model('KeyToken', keyTokenSchema); 