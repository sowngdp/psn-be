'use strict';

const app = require('./src/app');
const { PORT } = require('./src/configs/env');
const { init: initJwtConfig } = require('./src/configs/jwt');

// Hàm khởi động server
const startServer = async () => {
  try {
    // Đảm bảo JWT config đã được khởi tạo
    await initJwtConfig();
    
    // Khởi động server
    const server = app.listen(PORT, () => {
      console.log(`PSN-BE server is running on port ${PORT}`);
    });
    
    // Xử lý tắt server gracefully
    process.on('SIGINT', () => {
      server.close(() => {
        console.log('PSN-BE server closed');
        process.exit(0);
      });
    });
    
    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Gọi hàm khởi động server
if (require.main === module) {
  startServer().catch(err => {
    console.error('Fatal error during server startup:', err);
    process.exit(1);
  });
}

module.exports = startServer;
