# Core Infrastructure - Danh sách nhiệm vụ

## Thiết lập cấu trúc dự án

- [x] Tạo cấu trúc thư mục dự án theo TDD (In Progress)
- [x] Cài đặt các dependencies cơ bản (express, mongoose, jsonwebtoken, bcryptjs, etc.) (In Progress)
- [x] Cấu hình .env và gitignore (In Progress)
- [x] Thiết lập file server.js và app.js (In Progress)
- [x] Cài đặt ESLint và Prettier (nếu cần) (In Progress)

## Cấu hình cơ sở dữ liệu

- [x] Cấu hình kết nối MongoDB (src/configs/database.js) (In Progress)
- [x] Thiết lập biến môi trường cho database (src/configs/env.js) (In Progress)
- [x] Tạo cơ chế retry và error handling cho kết nối database (In Progress)
- [x] Thiết lập logging cho database operations (In Progress)

## Core modules

- [x] Xây dựng error.response.js (Completed)
  - [x] ErrorResponse class (Completed)
  - [x] ConflictError class (Completed)
  - [x] BadRequestError class (Completed)
  - [x] AuthFailureError class (Completed)
  - [x] NotFoundError class (Completed)
  - [x] ForbiddenError class (Completed)
  - [x] InternalServerError class (Completed)
  
- [x] Xây dựng success.response.js (Completed)
  - [x] SuccessResponse class (Completed)
  - [x] OK class (Completed)
  - [x] CREATED class (Completed)
  - [x] ACCEPTED class (Completed)

- [x] Xây dựng helper functions (Completed)
  - [x] asyncHandler.js (Completed)
  - [x] formatData.js (nếu cần) (Completed)

- [x] Thiết lập constants (Completed)
  - [x] httpStatusCode.js (Completed)
  - [x] reasonPhrases.js (Completed)

## Logging system

- [x] Cấu hình Winston logger (src/utils/logger.js) (Completed)
- [x] Thiết lập log levels (Completed)
- [x] Cấu hình log rotation và log files (Completed)
- [x] Tạo log transport cho console và file (Completed)

## Database models

- [x] Xây dựng User model (Completed)
  - [x] Schema definition (Completed)
  - [x] Các methods cần thiết (comparePassword, etc.) (Completed)
  - [x] Hooks (pre-save, etc.) (Completed)
  
- [x] Xây dựng KeyToken model (Completed)
  - [x] Schema definition (Completed)
  - [x] Các methods cần thiết (Completed)

## JWT và Authentication

- [x] Cấu hình JWT (src/configs/jwt.js) (Completed)
- [x] Xây dựng TokenService (src/services/token.service.js) (Completed)
  - [x] createTokenPair (Completed)
  - [x] verifyToken (Completed)
  - [x] decodeToken (Completed)
  
- [x] Xây dựng KeyTokenService (src/services/key-token.service.js) (Completed)
  - [x] createKeyToken (Completed)
  - [x] findByUserId (Completed)
  - [x] removeKeyById (Completed)
  - [x] findByRefreshToken (Completed)
  - [x] findByRefreshTokenUsed (Completed)
  - [x] deleteKeyById (Completed)
  
- [x] Xây dựng AuthService (src/services/auth.service.js) (Completed)
  - [x] signUp (Completed)
  - [x] login (Completed)
  - [x] logout (Completed)
  - [x] refreshToken (Completed)
  - [x] requestPasswordReset (Completed)
  - [x] resetPassword (Completed)

## API Controllers và Routes

- [x] Xây dựng AuthController (src/api/controllers/auth.controller.js) (Completed)
  - [x] signUp (Completed)
  - [x] login (Completed)
  - [x] logout (Completed)
  - [x] refreshToken (Completed)
  - [x] requestPasswordReset (Completed)
  - [x] resetPassword (Completed)
  
- [x] Thiết lập auth routes (src/api/routes/auth.route.js) (Completed)
- [x] Tích hợp routes vào index.js (src/api/routes/index.js) (Completed)

## Middleware

- [x] Authentication Middleware (src/api/middleware/authentication.js) (Completed)
  - [x] isAuthenticated (Completed)
  - [x] isAdmin (Completed)
  
- [x] Permission Middleware (src/api/middleware/permission.js) (Completed)
- [x] Validator Middleware (src/api/middleware/validator.js) (Completed)
- [x] Error Handler Middleware (src/api/middleware/error.handler.js) (Completed)

## API Documentation

- [x] Cấu hình Swagger (src/configs/swagger.js) (Completed)
- [x] Viết API documentation cho authentication endpoints (Completed)
- [x] Thiết lập swagger-ui-express (Completed)

## Testing

- [x] Viết unit tests cho AuthService (Completed)
- [x] Viết unit tests cho TokenService (Completed)
- [x] Viết unit tests cho KeyTokenService (Completed)
- [x] Viết integration tests cho auth endpoints (Completed)

## Hoàn thiện

- [x] Code review và refactoring (In Progress)
  - [x] Refactoring Error Handling System (Completed)
  - [x] Refactoring Logging System (Completed)
  - [x] Refactoring Project Structure (Completed)
  - [ ] Refactoring Authentication & Security (In Progress) 
- [x] Tối ưu hóa error handling (In Progress)
- [x] Hoàn thiện logging (In Progress)
- [x] Kiểm tra bảo mật (In Progress)
- [x] Cập nhật README.md với hướng dẫn cài đặt và chạy dự án (In Progress)

## Lịch sử thay đổi
- 2023-XX-XX: Tạo danh sách nhiệm vụ ban đầu
- 2023-XX-XX: Cập nhật trạng thái các nhiệm vụ dựa trên codebase hiện tại
- 2023-XX-XX: Chuyển trạng thái từ Completed sang In Progress cho việc refactoring
- 2023-XX-XX: Hoàn thành refactoring Error Handling và Logging System
- 2023-XX-XX: Hoàn thành refactoring Project Structure với Repository Pattern 