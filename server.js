'use strict';

const app = require('./src/app');
const { PORT } = require('./src/configs/env');

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

module.exports = server;
