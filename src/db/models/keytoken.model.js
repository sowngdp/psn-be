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
    }
}, {
    timestamps: true,
    collection: 'KeyTokens'
});

module.exports = mongoose.model('KeyToken', keyTokenSchema); 