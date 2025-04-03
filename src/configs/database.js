'use strict'

const mongoose = require('mongoose');
const { 
  db: { host, port, name, username, password }
} = require('./config.mongodb');

// Xác định URI kết nối
const connectString = username && password
  ? `mongodb+srv://${username}:${password}${name}`
  : `mongodb://${host}:${port}/${name}`;

// Thiết lập kết nối và xử lý các sự kiện
class Database {
  constructor() {
    this.connect();
  }

  // Kết nối đến MongoDB
  connect(type = 'mongodb') {
    if (process.env.NODE_ENV === 'dev') {
      mongoose.set('debug', true);
      mongoose.set('debug', { color: true });
    }

    mongoose.connect(connectString, {
      maxPoolSize: 50
    })
    .then(() => console.log(`MongoDB connection successful!`))
    .catch(err => console.error(`MongoDB connection error:`, err));
    
    // Xử lý các sự kiện của kết nối
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
    
    // Xử lý khi ứng dụng đóng
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

const instanceMongodb = Database.getInstance();
module.exports = instanceMongodb; 