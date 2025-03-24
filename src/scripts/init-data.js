'use strict';

const mongoose = require('mongoose');
const { db } = require('../configs/config.mongodb');
const apiKeyModel = require('../models/apiKey.model');
const userModel = require('../models/models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const connectString = db.username && db.password
  ? `mongodb+srv://${db.username}:${db.password}@${db.host}/${db.name}?retryWrites=true&w=majority`
  : `mongodb://${db.host}:${db.port}/${db.name}`;

const initializeData = async () => {
  try {
    // Kết nối đến MongoDB
    await mongoose.connect(connectString);
    console.log('Kết nối MongoDB thành công!');

    // Tạo API Key mặc định
    const apiKey = await apiKeyModel.findOne({ key: 'psn-api-key-2024' });
    if (!apiKey) {
      await apiKeyModel.create({
        key: 'psn-api-key-2024',
        permissions: ['0000'],
        status: true
      });
      console.log('Đã tạo API Key mặc định');
    }

    // Tạo tài khoản quản trị viên mặc định
    const adminEmail = 'admin@psn.com';
    const adminUser = await userModel.findOne({ email: adminEmail });
    if (!adminUser) {
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      await userModel.create({
        name: 'Admin',
        email: adminEmail,
        password: passwordHash,
        roles: ['ADMIN'],
        isVerified: true
      });
      console.log('Đã tạo tài khoản quản trị viên mặc định');
    }

    console.log('Khởi tạo dữ liệu ban đầu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi khởi tạo dữ liệu:', error);
    process.exit(1);
  }
};

initializeData(); 