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
    .then(() => console.log(`Kết nối MongoDB thành công!`))
    .catch(err => console.error(`Lỗi kết nối MongoDB:`, err));
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