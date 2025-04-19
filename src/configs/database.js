'use strict'

const mongoose = require('mongoose');
const { 
  db: { host, port, name, username, password }
} = require('./config.mongodb');
const logger = require('../utils/logger');

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
    .then(() => {
      console.log(`MongoDB connection successful!`);
      this.createIndexes().catch(err => {
        logger.error('Error creating indexes', err);
      });
    })
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

  // Tạo các indexes cho các collections
  async createIndexes() {
    try {
      // Import các repositories
      const { ItemRepository, OutfitRepository } = require('../db/repositories');
      
      // Khởi tạo repositories
      const itemRepo = new ItemRepository();
      const outfitRepo = new OutfitRepository();
      
      // Tạo indexes
      await itemRepo.createIndexes();
      if (typeof outfitRepo.createIndexes === 'function') {
        await outfitRepo.createIndexes();
      }
      
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes', error);
      throw error;
    }
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