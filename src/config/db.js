'use strict'

const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
  try {
    const options = {
      // Các tùy chọn kết nối MongoDB
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Thêm các tùy chọn khác nếu cần
    };
    console.log(MONGODB_URI);
    const connection = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    
    // Xử lý các events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    // Xử lý khi ứng dụng đóng
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Không đóng ứng dụng ngay, thử kết nối lại
    console.log('Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB();
    }, 5000);
  }
};

module.exports = { connectDB };