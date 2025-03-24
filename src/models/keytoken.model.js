// luu lai idUser, User, publicKey, refreshToken ma ngta da su dung

'use strict';

const { Schema, model } = require('mongoose');

const DOCUMENT_NAME = 'Key';
const COLLECTION_NAME = "Keys";

const keyTokenSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Account'
    },
    publicKey: {
        type: String,
        required: true,
    },
    privateKey: {
        type: String,
        required: true,
    },
    //refresh token đó chính là nhiệm vụ chúng ta sau này
    //chúng ta sẽ làm chức năng để check các hacker sử dụng trái phép token này
    //và chúng ta xử lý trong model này luôn
    refreshTokensUsed: {
        type: Array,
        default: []
    },
    refreshToken: {
        type: String,
        required: true,
    }
}, {
    collection: COLLECTION_NAME,
    timestamps: true,
});

module.exports = model(DOCUMENT_NAME, keyTokenSchema);