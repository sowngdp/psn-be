/**
 * Script di chuyển cấu trúc thư mục
 * Chạy: node src/migrate-structure.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Đường dẫn gốc của dự án
const ROOT_DIR = path.resolve(__dirname, '../');

// Danh sách thư mục cần tạo
const DIRECTORIES = [
  'src/api/controllers',
  'src/api/middleware',
  'src/api/routes',
  'src/api/validators',
  'src/auth/strategies',
  'src/auth/middleware',
  'src/config',
  'src/core',
  'src/db/models',
  'src/db/repositories',
  'src/db/seed',
  'src/services',
  'src/utils/helpers',
  'src/utils/constants',
  'src/utils/logger',
  'src/tests/unit',
  'src/tests/integration',
  'src/tests/fixtures',
  'src/docs',
  'src/scripts',
];

// Danh sách các file cần di chuyển
const FILE_MAPPINGS = [
  // Controllers
  { from: 'src/controllers/access.controller.js', to: 'src/api/controllers/access.controller.js' },
  { from: 'src/controllers/user.controller.js', to: 'src/api/controllers/user.controller.js' },
  { from: 'src/controllers/item.controller.js', to: 'src/api/controllers/item.controller.js' },
  { from: 'src/controllers/outfit.controller.js', to: 'src/api/controllers/outfit.controller.js' },
  { from: 'src/controllers/recommendation.controller.js', to: 'src/api/controllers/recommendation.controller.js' },
  
  // Routers
  { from: 'src/routers/access/index.js', to: 'src/api/routes/auth.routes.js' },
  { from: 'src/routers/users/index.js', to: 'src/api/routes/user.routes.js' },
  { from: 'src/routers/items/index.js', to: 'src/api/routes/item.routes.js' },
  { from: 'src/routers/outfits/index.js', to: 'src/api/routes/outfit.routes.js' },
  { from: 'src/routers/style-rules/index.js', to: 'src/api/routes/style-rule.routes.js' },
  { from: 'src/routers/recommendations/index.js', to: 'src/api/routes/recommendation.routes.js' },
  { from: 'src/routers/index.js', to: 'src/api/routes/index.js' },
  
  // Auth
  { from: 'src/auth/authUtils.js', to: 'src/auth/middleware/authentication.js' },
  
  // Models
  { from: 'src/models/models/User.js', to: 'src/db/models/user.model.js' },
  { from: 'src/models/models/Item.js', to: 'src/db/models/item.model.js' },
  { from: 'src/models/models/Outfit.js', to: 'src/db/models/outfit.model.js' },
  { from: 'src/models/models/StyleRule.js', to: 'src/db/models/style-rule.model.js' },
  { from: 'src/models/models/Recommendation.js', to: 'src/db/models/recommendation.model.js' },
  { from: 'src/models/models/Schedule.js', to: 'src/db/models/schedule.model.js' },
  
  // Services
  { from: 'src/services/access.service.js', to: 'src/services/access.service.js' },
  { from: 'src/services/user.service.js', to: 'src/services/user.service.js' },
  { from: 'src/services/item.service.js', to: 'src/services/item.service.js' },
  { from: 'src/services/outfit.service.js', to: 'src/services/outfit.service.js' },
  { from: 'src/services/styleRule.service.js', to: 'src/services/style-rule.service.js' },
  { from: 'src/services/recommendation.service.js', to: 'src/services/recommendation.service.js' },
  
  // Core
  { from: 'src/core/error.response.js', to: 'src/core/error.response.js' },
  { from: 'src/core/success.response.js', to: 'src/core/success.response.js' },
  
  // Config
  { from: 'src/configs/config.js', to: 'src/config/env.js' },
  { from: 'src/dbs/init.mongodb.js', to: 'src/config/db.js' },
  
  // App
  { from: 'src/app.js', to: 'src/app.js' },
];

// Tạo các thư mục mới
console.log('Tạo các thư mục mới...');
DIRECTORIES.forEach(dir => {
  const fullPath = path.join(ROOT_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Đã tạo thư mục: ${dir}`);
  }
});

// Di chuyển các file
console.log('\nDi chuyển các file...');
FILE_MAPPINGS.forEach(mapping => {
  const fromPath = path.join(ROOT_DIR, mapping.from);
  const toPath = path.join(ROOT_DIR, mapping.to);
  
  // Kiểm tra nếu file nguồn tồn tại
  if (fs.existsSync(fromPath)) {
    // Đảm bảo thư mục đích tồn tại
    const toDir = path.dirname(toPath);
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }
    
    // Sao chép file
    fs.copyFileSync(fromPath, toPath);
    console.log(`✅ Đã sao chép: ${mapping.from} -> ${mapping.to}`);
  } else {
    console.log(`⚠️ File không tồn tại: ${mapping.from}`);
  }
});

// Tạo file server.js mới
console.log('\nTạo file server.js...');
const serverContent = `'use strict';

const app = require('./app');
const { PORT } = require('./config/env');

const server = app.listen(PORT, () => {
  console.log(\`PSN-BE server is running on port \${PORT}\`);
});

// Xử lý tắt server gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('PSN-BE server closed');
    process.exit(0);
  });
});

module.exports = server;
`;

fs.writeFileSync(path.join(ROOT_DIR, 'src/server.js'), serverContent);
console.log('✅ Đã tạo file server.js');

// Tạo file index route mới
console.log('\nTạo file routes index...');
const routesIndexContent = `'use strict';

const express = require('express');
const router = express.Router();

// Import các routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const itemRoutes = require('./item.routes');
const outfitRoutes = require('./outfit.routes');
const styleRuleRoutes = require('./style-rule.routes');
const recommendationRoutes = require('./recommendation.routes');

// Đăng ký routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/outfits', outfitRoutes);
router.use('/style-rules', styleRuleRoutes);
router.use('/recommendations', recommendationRoutes);

module.exports = router;
`;

fs.writeFileSync(path.join(ROOT_DIR, 'src/api/routes/index.js'), routesIndexContent);
console.log('✅ Đã tạo file routes index');

// Tạo file constants
console.log('\nTạo các file constants...');
const statusConstantsContent = `'use strict';

const StatusCodes = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER: 500,
  SERVICE_UNAVAILABLE: 503
};

module.exports = StatusCodes;
`;

fs.writeFileSync(path.join(ROOT_DIR, 'src/utils/constants/status.constants.js'), statusConstantsContent);
console.log('✅ Đã tạo file status.constants.js');

// Tạo file logger
console.log('\nTạo file logger...');
const loggerContent = `'use strict';

const winston = require('winston');
const { format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Định dạng log cho môi trường development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  return \`\${timestamp} [\${level}]: \${message} \${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}\`;
});

// Logger cho môi trường development
const developmentLogger = winston.createLogger({
  level: 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    devFormat
  ),
  transports: [
    new transports.Console()
  ]
});

// Logger cho môi trường production
const productionLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Chọn logger phù hợp dựa vào môi trường
const logger = process.env.NODE_ENV === 'production' ? productionLogger : developmentLogger;

module.exports = logger;
`;

fs.writeFileSync(path.join(ROOT_DIR, 'src/utils/logger/index.js'), loggerContent);
console.log('✅ Đã tạo file logger');

console.log('\n✅ Quá trình di chuyển cấu trúc thư mục hoàn tất!');
console.log('⚠️ Lưu ý: Script này chỉ sao chép các file, không xóa file cũ.');
console.log('⚠️ Bạn nên kiểm tra các import/require path trong mỗi file để đảm bảo chúng chính xác với cấu trúc mới.'); 