# TDD: Giai đoạn 1 - Core Infrastructure

## 1. Tổng quan

### 1.1 Mục đích
Tài liệu này mô tả thiết kế kỹ thuật chi tiết cho giai đoạn 1 của dự án PSN-BE: Core Infrastructure. Giai đoạn này tập trung vào việc thiết lập nền tảng cơ bản cho toàn bộ hệ thống.

### 1.2 Phạm vi
- Thiết lập cấu trúc dự án
- Xây dựng hệ thống authentication và authorization
- Định nghĩa core database models
- Triển khai error handling và logging

### 1.3 Thời gian dự kiến
2 tuần

## 2. Thiết kế kỹ thuật

### 2.1 Cấu trúc dự án

#### 2.1.1 Thư mục và cấu trúc mã nguồn
```
src/
├── api/
│   ├── controllers/
│   ├── middleware/
│   │   ├── authentication.js
│   │   ├── permission.js
│   │   ├── validator.js
│   │   └── error.handler.js
│   └── routes/
│       ├── index.js
│       └── auth.route.js
├── configs/
│   ├── database.js
│   ├── env.js
│   ├── jwt.js
│   └── swagger.js
├── core/
│   ├── error.response.js
│   └── success.response.js
├── db/
│   └── models/
│       ├── user.model.js
│       └── key-token.model.js
├── helpers/
│   └── asyncHandler.js
├── services/
│   ├── auth.service.js
│   ├── token.service.js
│   └── key-token.service.js
├── utils/
│   ├── constants/
│   │   ├── httpStatusCode.js
│   │   └── reasonPhrases.js
│   └── logger.js
└── app.js
```

#### 2.1.2 Công nghệ và thư viện
- **express**: Web framework
- **mongoose**: ODM cho MongoDB
- **jsonwebtoken**: Xử lý JWT
- **bcryptjs**: Hash mật khẩu
- **dotenv**: Quản lý biến môi trường
- **winston**: Logging
- **joi/express-validator**: Validation
- **helmet**: Security headers
- **cors**: Cross-Origin Resource Sharing
- **compression**: Response compression
- **swagger-jsdoc/swagger-ui-express**: API documentation

### 2.2 Authentication và Authorization

#### 2.2.1 Quy trình xác thực
1. Đăng ký: 
   - Thu thập thông tin người dùng
   - Xác thực email/số điện thoại
   - Hash mật khẩu
   - Tạo user document trong database

2. Đăng nhập:
   - Xác thực username/email và mật khẩu
   - Tạo JWT (access token & refresh token)
   - Lưu trữ token trong database
   - Trả về tokens cho client

3. Refresh token:
   - Xác thực refresh token
   - Tạo access token mới
   - Cập nhật database nếu cần
   - Trả về access token mới

4. Đăng xuất:
   - Vô hiệu hóa token hiện tại
   - Cập nhật trạng thái trong database

#### 2.2.2 Mô hình JWT
- **Access Token**: Thông tin xác thực ngắn hạn (1 giờ)
- **Refresh Token**: Token dài hạn (7 ngày) để làm mới access token
- **Token Storage**: Lưu trữ trong database (KeyToken model)
- **Token Rotation**: Refresh token được cập nhật sau mỗi lần sử dụng
- **Payload**: userId, role, permissions

#### 2.2.3 Phân quyền
- **Roles**: User, Admin
- **Middleware**: Kiểm tra role và permission dựa trên JWT payload
- **Permission-based**: Quản lý quyền truy cập chi tiết cho từng API endpoint

### 2.3 Database Models

#### 2.3.1 User Model
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  preferences: {
    stylePreferences: [{ type: String }],
    favoriteColors: [{ type: String }],
    occasions: [{ type: String }]
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  verified: { type: Boolean, default: false }
}, { 
  timestamps: true,
  collection: 'users' 
});
```

#### 2.3.2 KeyToken Model
```javascript
const keyTokenSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  refreshTokensUsed: { type: Array, default: [] },
  refreshToken: { type: String, required: true },
}, {
  timestamps: true,
  collection: 'keys'
});
```

### 2.4 Error Handling và Logging

#### 2.4.1 Error Response Classes
```javascript
// core/error.response.js
class ErrorResponse extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

class BadRequestError extends ErrorResponse {
  constructor(message = reasonPhrases.BAD_REQUEST) {
    super(message, statusCodes.BAD_REQUEST);
  }
}

class AuthFailureError extends ErrorResponse {
  constructor(message = reasonPhrases.UNAUTHORIZED) {
    super(message, statusCodes.UNAUTHORIZED);
  }
}

class NotFoundError extends ErrorResponse {
  constructor(message = reasonPhrases.NOT_FOUND) {
    super(message, statusCodes.NOT_FOUND);
  }
}

// ... other error classes
```

#### 2.4.2 Error Middleware
```javascript
// api/middleware/error.handler.js
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`Error ${err.status || 500}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: err.message || 'Lỗi server',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
```

#### 2.4.3 Logging System
```javascript
// utils/logger.js
const winston = require('winston');
const path = require('path');

const logConfiguration = {
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      level: 'error',
      filename: path.join(__dirname, '../../logs/error.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      level: 'info',
      filename: path.join(__dirname, '../../logs/combined.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
};

const logger = winston.createLogger(logConfiguration);

module.exports = logger;
```

## 3. API Endpoints

### 3.1 Authentication Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/v1/api/auth/signup` | Đăng ký người dùng | `{ name, email, password }` | `{ status, data: { userId, email } }` |
| POST | `/v1/api/auth/login` | Đăng nhập | `{ email, password }` | `{ status, data: { user, tokens } }` |
| POST | `/v1/api/auth/logout` | Đăng xuất | `{ refreshToken }` | `{ status, message }` |
| POST | `/v1/api/auth/refresh` | Làm mới token | `{ refreshToken }` | `{ status, data: { accessToken } }` |
| POST | `/v1/api/auth/request-reset` | Yêu cầu đặt lại mật khẩu | `{ email }` | `{ status, message }` |
| POST | `/v1/api/auth/reset-password` | Đặt lại mật khẩu | `{ token, password }` | `{ status, message }` |

## 4. Kế hoạch triển khai

### 4.1 Danh sách công việc
1. Thiết lập cấu trúc thư mục dự án
2. Cài đặt các dependencies cơ bản
3. Cấu hình MongoDB và kết nối
4. Triển khai core modules (error, success responses)
5. Triển khai logging system
6. Xây dựng User và KeyToken models
7. Triển khai JWT configuration
8. Xây dựng authentication services (auth, token, key-token)
9. Triển khai authentication controllers và routes
10. Triển khai middleware (authentication, error handling)
11. Cấu hình Swagger cho API documentation
12. Viết unit tests cho các services

### 4.2 Chiến lược test
- **Unit Tests**: Test các functions trong services
- **Integration Tests**: Test API endpoints
- **Test Coverage**: Đảm bảo coverage tối thiểu 80% cho business logic

## 5. Kết luận

Giai đoạn 1 - Core Infrastructure là nền tảng quan trọng cho toàn bộ dự án PSN-BE. Giai đoạn này tập trung vào việc thiết lập cấu trúc dự án, triển khai hệ thống authentication/authorization, định nghĩa core database models, và thiết lập error handling/logging. Việc hoàn thành giai đoạn này sẽ tạo ra nền tảng vững chắc cho việc phát triển các tính năng phức tạp hơn trong các giai đoạn tiếp theo. 