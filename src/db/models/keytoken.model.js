const mongoose = require('mongoose');

const keyTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    publicKey: {
        type: String,
        required: true
    },
    privateKey: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    refreshTokensUsed: {
        type: [String],
        default: []
    },
    lastRotated: {
        type: Date,
        default: Date.now
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
    securityIncidents: {
        type: [{
            type: { type: String, enum: ['token_reuse', 'device_mismatch', 'suspicious_activity'] },
            timestamp: { type: Date, default: Date.now },
            ip: String,
            userAgent: String,
            details: String
        }],
        default: []
    }
}, {
    timestamps: true,
    collection: 'KeyTokens'
});

keyTokenSchema.index({ user: 1 });
keyTokenSchema.index({ refreshToken: 1 });

module.exports = mongoose.model('KeyToken', keyTokenSchema); 