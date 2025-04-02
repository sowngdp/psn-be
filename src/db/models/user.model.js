'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const DOCUMENT_NAME = 'user';
const COLLECTION_NAME = 'users';

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  roles: {
    type: [String],
    default: ['USER']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: COLLECTION_NAME
});

// Phương thức so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Middleware hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model(DOCUMENT_NAME, userSchema); 
