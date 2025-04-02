'use strict';

const mongoose = require('mongoose');

const DOCUMENT_NAME = 'KeyToken';
const COLLECTION_NAME = 'KeyTokens';

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
  refreshTokensUsed: {
    type: Array,
    default: []
  },
  refreshToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d'
  }
}, {
  timestamps: true,
  collection: COLLECTION_NAME
});

module.exports = mongoose.model(DOCUMENT_NAME, keyTokenSchema);
