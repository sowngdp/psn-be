# Enhancement Authentication - Hỗ trợ Đăng nhập Google & Apple

## Tổng quan
Task này bổ sung hỗ trợ đăng nhập bằng tài khoản Google và Apple cho hệ thống PSN-BE, giúp người dùng có thêm lựa chọn đăng nhập nhanh chóng và thuận tiện.

## Checklist Tasks

### 1. Nghiên cứu & Chuẩn bị
- [x] Nghiên cứu Google OAuth 2.0 API và Apple Sign In API
- [x] Đăng ký ứng dụng trên Google Cloud Console & Apple Developer Portal
- [x] Chuẩn bị client ID, client secret và các thông tin xác thực khác
- [x] Thêm các dependency cần thiết: `google-auth-library`

### 2. Cập nhật Database Model
- [x] Cập nhật `src/db/models/user.model.js` để thêm trường thông tin cho OAuth
  - [x] Thêm trường `googleId`, `appleId` 
  - [x] Thêm trường `provider` (để xác định tài khoản đăng nhập bằng local/google/apple)
  - [x] Thêm trường `providerData` (để lưu thông tin bổ sung từ provider)

### 3. Triển khai Xác thực Google
- [x] Tạo file `src/services/google-auth.service.js`
  - [x] Thêm hàm `verifyGoogleToken` để xác thực token ID từ Google
  - [x] Thêm hàm `findOrCreateGoogleUser` để tìm hoặc tạo user mới từ thông tin Google
- [x] Cập nhật `src/services/auth.service.js`
  - [x] Thêm method `loginWithGoogle(idToken)` 
  - [x] Xử lý login/signup từ thông tin Google
- [x] Cập nhật `src/api/controllers/auth.controller.js`
  - [x] Thêm endpoint `loginWithGoogle`

### 4. Triển khai Xác thực Apple
- [ ] Tạo file `src/services/apple-auth.service.js`
  - [ ] Thêm hàm `verifyAppleToken` để xác thực token từ Apple
  - [ ] Thêm hàm `findOrCreateAppleUser` để tìm hoặc tạo user mới từ thông tin Apple
- [ ] Cập nhật `src/services/auth.service.js`
  - [ ] Thêm method `loginWithApple(idToken, userInfo)` 
  - [ ] Xử lý login/signup từ thông tin Apple
- [ ] Cập nhật `src/api/controllers/auth.controller.js`
  - [ ] Thêm endpoint `loginWithApple`

### 5. Cập nhật Routes
- [x] Cập nhật `src/api/routes/auth.route.js`
  - [x] Thêm route `/login/google`
  - [ ] Thêm route `/login/apple`

### 6. Middleware Validation
- [x] Cập nhật `src/api/middlewares/validator.js` hoặc tạo validation riêng
  - [x] Thêm validator cho Google token
  - [ ] Thêm validator cho Apple token

### 7. Cập nhật Config & Environment Variables
- [x] Cập nhật `src/configs/env.js`
  - [x] Thêm các biến môi trường cho Google OAuth: `GOOGLE_CLIENT_ID`
  - [ ] Thêm các biến môi trường cho Apple Sign In: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_PATH`

### 8. Xử lý Liên kết Tài khoản
- [x] Cập nhật `src/services/user.service.js`
  - [x] Thêm method `linkGoogleAccount(userId, googleData)`
  - [x] Thêm method `unlinkProvider(userId, provider)` (hỗ trợ cả Google và Apple)
- [x] Cập nhật `src/api/controllers/user.controller.js`
  - [x] Thêm endpoint để liên kết/hủy liên kết tài khoản

### 9. Testing
- [x] Cập nhật Postman collection với các test mới
  - [x] Test cho `login/google`
  - [x] Test cho liên kết/hủy liên kết tài khoản Google
- [ ] Viết unit tests cho các service mới
  - [ ] Test cho `google-auth.service.js`
  - [ ] Test cho `apple-auth.service.js`

### 10. Documentation
- [x] Cập nhật Swagger cho API mới
- [x] Cập nhật README với hướng dẫn thiết lập OAuth
- [x] Cập nhật Postman documentation

## Thông tin bổ sung
- Google OAuth docs: https://developers.google.com/identity/protocols/oauth2
- Apple Sign In docs: https://developer.apple.com/sign-in-with-apple/
- Lưu ý xử lý các trường hợp đặc biệt:
  - User đăng nhập bằng OAuth nhưng email đã tồn tại trong hệ thống
  - Liên kết nhiều provider cho cùng một tài khoản
  - Xử lý token refresh đối với các provider 