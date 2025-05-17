# Hướng Dẫn Kiểm Thử Authentication API

## 1. Giới Thiệu

Tài liệu này cung cấp hướng dẫn chi tiết về cách kiểm thử tất cả các Authentication API endpoints của hệ thống PSN-BE, bao gồm đăng ký, đăng nhập, đăng xuất, làm mới token và quản lý mật khẩu.

## 2. Cài Đặt & Chuẩn Bị

### 2.1. Biến Môi Trường Đặc Biệt cho Authentication

Ngoài các biến môi trường chung được mô tả trong [Tổng quan](./api-testing-overview.md), API authentication cần các biến sau:

| Biến | Mô tả |
|------|-------|
| `testEmail` | Email dùng cho việc test đăng ký/đăng nhập |
| `testPassword` | Mật khẩu dùng cho việc test đăng ký/đăng nhập |
| `testNewPassword` | Mật khẩu mới cho việc test đổi mật khẩu |
| `resetToken` | Token đặt lại mật khẩu nhận được từ API quên mật khẩu |

### 2.2. Collection Setup

Để chuẩn bị cho việc test API Authentication, hãy tạo một thư mục "Authentication" trong collection của bạn và thêm tất cả các API endpoint vào đó:

1. Nhấp chuột phải vào collection và chọn "Add Folder"
2. Đặt tên folder là "Authentication"
3. Thêm từng request vào folder này theo hướng dẫn bên dưới

## 3. Danh Sách API Endpoints

### 3.1. Đăng Ký Tài Khoản
- **Endpoint**: `POST /auth/signup`
- **Mô tả**: Tạo tài khoản người dùng mới

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Sign Up"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/signup`
5. Tab Headers: Thêm header `Content-Type: application/json`
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "email": "{{testEmail}}",
     "password": "{{testPassword}}",
     "fullName": "Test User",
     "phone": "0123456789"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode');
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('user');
});

// Lưu userId nếu cần thiết cho các test khác
const jsonData = pm.response.json();
if (jsonData.metadata && jsonData.metadata.user && jsonData.metadata.user._id) {
    pm.environment.set("userId", jsonData.metadata.user._id);
}
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789"
  }
  ```
- **Response Success (201)**: 
  ```json
  {
    "statusCode": 201,
    "message": "Đăng ký thành công",
    "metadata": {
      "user": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "email": "user@example.com",
        "fullName": "Nguyễn Văn A",
        "status": "active"
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Email mới, thông tin đầy đủ
2. **Email đã tồn tại**: Cố gắng đăng ký với email đã tồn tại
3. **Mật khẩu yếu**: Thử với mật khẩu không đáp ứng yêu cầu
4. **Thiếu thông tin**: Bỏ qua các trường bắt buộc

#### Possible Errors:
- `400`: Email đã tồn tại
  ```json
  {
    "statusCode": 400,
    "message": "Email đã được sử dụng",
    "errors": null
  }
  ```
- `400`: Dữ liệu không hợp lệ
  ```json
  {
    "statusCode": 400,
    "message": "Dữ liệu không hợp lệ",
    "errors": ["Mật khẩu phải có ít nhất 8 ký tự"]
  }
  ```
- `500`: Lỗi server
  ```json
  {
    "statusCode": 500,
    "message": "Lỗi hệ thống",
    "errors": null
  }
  ```

### 3.2. Đăng Nhập
- **Endpoint**: `POST /auth/login`
- **Mô tả**: Xác thực người dùng và trả về access/refresh token

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Login"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/login`
5. Tab Headers: Thêm header `Content-Type: application/json`
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "email": "{{testEmail}}",
     "password": "{{testPassword}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('user');
    pm.expect(jsonData.metadata).to.have.property('tokens');
    pm.expect(jsonData.metadata.tokens).to.have.property('accessToken');
    pm.expect(jsonData.metadata.tokens).to.have.property('refreshToken');
});

// Lưu tokens vào biến môi trường
const response = pm.response.json();
if (response.metadata && response.metadata.tokens) {
    pm.environment.set("token", response.metadata.tokens.accessToken);
    pm.environment.set("refreshToken", response.metadata.tokens.refreshToken);
    
    // Thiết lập thời gian hết hạn (ví dụ: 1 giờ)
    const expiryTime = new Date().getTime() + 60 * 60 * 1000;
    pm.environment.set("tokenExpiry", expiryTime.toString());

    // Lưu userId nếu có
    if (response.metadata.user && response.metadata.user._id) {
        pm.environment.set("userId", response.metadata.user._id);
    }
}

console.log("Token saved: " + pm.environment.get("token").substring(0, 20) + "...");
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Đăng nhập thành công",
    "metadata": {
      "user": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "email": "user@example.com",
        "fullName": "Nguyễn Văn A"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Email và mật khẩu chính xác
2. **Sai Email**: Email không tồn tại
3. **Sai Mật Khẩu**: Mật khẩu không chính xác
4. **Tài Khoản Bị Khóa**: Đăng nhập với tài khoản đã bị khóa

#### Possible Errors:
- `401`: Email hoặc mật khẩu không chính xác
  ```json
  {
    "statusCode": 401,
    "message": "Email hoặc mật khẩu không chính xác",
    "errors": null
  }
  ```
- `403`: Tài khoản bị khóa
  ```json
  {
    "statusCode": 403,
    "message": "Tài khoản của bạn đã bị khóa",
    "errors": null
  }
  ```
- `429`: Quá nhiều yêu cầu
  ```json
  {
    "statusCode": 429,
    "message": "Quá nhiều yêu cầu, vui lòng thử lại sau 5 phút",
    "errors": null
  }
  ```

### 3.3. Đăng Xuất
- **Endpoint**: `POST /auth/logout`
- **Mô tả**: Hủy token hiện tại và xóa session

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Logout"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/logout`
5. Tab Headers: Thêm header 
   ```
   Content-Type: application/json
   Authorization: Bearer {{token}}
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "refreshToken": "{{refreshToken}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
});

// Xóa tokens từ biến môi trường
pm.environment.unset("token");
pm.environment.unset("refreshToken");
pm.environment.unset("tokenExpiry");

console.log("Tokens have been cleared from environment");
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Đăng xuất thành công",
    "metadata": null
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Token và refresh token hợp lệ
2. **Invalid Token**: Access token không hợp lệ
3. **Invalid Refresh Token**: Refresh token không hợp lệ
4. **Missing Refresh Token**: Không có refresh token trong body

#### Possible Errors:
- `401`: Token không hợp lệ
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized - Invalid token",
    "errors": null
  }
  ```
- `404`: Refresh token không tồn tại
  ```json
  {
    "statusCode": 404,
    "message": "Refresh token không tồn tại",
    "errors": null
  }
  ```

### 3.4. Làm Mới Token
- **Endpoint**: `POST /auth/refresh-token`
- **Mô tả**: Tạo access token mới sử dụng refresh token

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Refresh Token"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/refresh-token`
5. Tab Headers: Thêm header `Content-Type: application/json`
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "refreshToken": "{{refreshToken}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('tokens');
    pm.expect(jsonData.metadata.tokens).to.have.property('accessToken');
    pm.expect(jsonData.metadata.tokens).to.have.property('refreshToken');
});

// Cập nhật tokens mới vào biến môi trường
const response = pm.response.json();
if (response.metadata && response.metadata.tokens) {
    pm.environment.set("token", response.metadata.tokens.accessToken);
    pm.environment.set("refreshToken", response.metadata.tokens.refreshToken);
    
    // Thiết lập thời gian hết hạn (ví dụ: 1 giờ)
    const expiryTime = new Date().getTime() + 60 * 60 * 1000;
    pm.environment.set("tokenExpiry", expiryTime.toString());
}

console.log("Tokens refreshed and updated in environment");
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Làm mới token thành công",
    "metadata": {
      "tokens": {
        "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Refresh token hợp lệ
2. **Invalid Refresh Token**: Refresh token không hợp lệ
3. **Expired Refresh Token**: Refresh token đã hết hạn
4. **Blacklisted Token**: Refresh token đã bị đưa vào blacklist

#### Possible Errors:
- `401`: Refresh token không hợp lệ
  ```json
  {
    "statusCode": 401,
    "message": "Invalid refresh token",
    "errors": null
  }
  ```
- `403`: Refresh token đã được sử dụng (token rotation)
  ```json
  {
    "statusCode": 403,
    "message": "Refresh token đã được sử dụng hoặc bị thu hồi",
    "errors": null
  }
  ```

### 3.5. Đổi Mật Khẩu
- **Endpoint**: `POST /auth/change-password`
- **Mô tả**: Cho phép người dùng đổi mật khẩu khi đã đăng nhập

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Change Password"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/change-password`
5. Tab Headers: Thêm header 
   ```
   Content-Type: application/json
   Authorization: Bearer {{token}}
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "currentPassword": "{{testPassword}}",
     "newPassword": "{{testNewPassword}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
});

// Cập nhật mật khẩu trong biến môi trường
if (pm.response.code === 200) {
    // Lưu mật khẩu mới làm mật khẩu hiện tại cho các test tiếp theo
    const oldPassword = pm.environment.get("testPassword");
    const newPassword = pm.environment.get("testNewPassword");
    
    pm.environment.set("testPassword", newPassword);
    // Backup mật khẩu cũ để có thể khôi phục nếu cần
    pm.environment.set("previousPassword", oldPassword);
    
    console.log("Password has been updated in environment variables");
}
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "currentPassword": "SecurePassword123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Đổi mật khẩu thành công",
    "metadata": null
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Mật khẩu hiện tại chính xác, mật khẩu mới hợp lệ
2. **Incorrect Current Password**: Mật khẩu hiện tại không đúng
3. **Weak New Password**: Mật khẩu mới không đủ mạnh
4. **Same Password**: Mật khẩu mới giống mật khẩu cũ

#### Possible Errors:
- `400`: Mật khẩu hiện tại không chính xác
  ```json
  {
    "statusCode": 400,
    "message": "Mật khẩu hiện tại không chính xác",
    "errors": null
  }
  ```
- `400`: Mật khẩu mới phải khác mật khẩu hiện tại
  ```json
  {
    "statusCode": 400,
    "message": "Mật khẩu mới phải khác mật khẩu hiện tại",
    "errors": null
  }
  ```
- `400`: Mật khẩu mới không đủ mạnh
  ```json
  {
    "statusCode": 400,
    "message": "Mật khẩu không đủ mạnh",
    "errors": ["Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"]
  }
  ```

### 3.6. Quên Mật Khẩu
- **Endpoint**: `POST /auth/forgot-password`
- **Mô tả**: Gửi email khôi phục mật khẩu cho người dùng

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Forgot Password"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/forgot-password`
5. Tab Headers: Thêm header `Content-Type: application/json`
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "email": "{{testEmail}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
});

// Trong môi trường development, API có thể trả về resetToken
// Lưu token này để sử dụng cho API reset password
const response = pm.response.json();
if (response.metadata && response.metadata.resetToken) {
    pm.environment.set("resetToken", response.metadata.resetToken);
    console.log("Reset token saved: " + response.metadata.resetToken);
}
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Email khôi phục mật khẩu đã được gửi",
    "metadata": {
      "resetToken": "abc123def456" // Chỉ có trong môi trường development
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Email tồn tại trong hệ thống
2. **Non-existent Email**: Email không tồn tại
3. **Rate Limiting**: Gửi quá nhiều yêu cầu trong thời gian ngắn

#### Possible Errors:
- `404`: Email không tồn tại
  ```json
  {
    "statusCode": 404,
    "message": "Email không tồn tại trong hệ thống",
    "errors": null
  }
  ```
- `429`: Quá nhiều yêu cầu
  ```json
  {
    "statusCode": 429,
    "message": "Quá nhiều yêu cầu, thử lại sau",
    "errors": null
  }
  ```

### 3.7. Đặt Lại Mật Khẩu
- **Endpoint**: `POST /auth/reset-password`
- **Mô tả**: Cho phép người dùng đặt lại mật khẩu bằng token nhận được từ email

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Reset Password"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/reset-password`
5. Tab Headers: Thêm header `Content-Type: application/json`
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "resetToken": "{{resetToken}}",
     "newPassword": "{{testNewPassword}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
});

// Cập nhật mật khẩu trong biến môi trường
if (pm.response.code === 200) {
    // Cập nhật mật khẩu hiện tại cho các test tiếp theo
    pm.environment.set("testPassword", pm.environment.get("testNewPassword"));
    console.log("Password has been updated in environment variables");
    
    // Xóa resetToken vì nó chỉ sử dụng được một lần
    pm.environment.unset("resetToken");
    console.log("Reset token has been cleared");
}
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "resetToken": "abc123def456",
    "newPassword": "NewSecurePassword789!"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Đặt lại mật khẩu thành công",
    "metadata": null
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Token hợp lệ, mật khẩu mới hợp lệ
2. **Invalid Token**: Token không hợp lệ
3. **Expired Token**: Token đã hết hạn
4. **Weak Password**: Mật khẩu mới không đủ mạnh
5. **Used Token**: Token đã được sử dụng trước đó

#### Possible Errors:
- `400`: Token đặt lại mật khẩu không hợp lệ
  ```json
  {
    "statusCode": 400,
    "message": "Token đặt lại mật khẩu không hợp lệ",
    "errors": null
  }
  ```
- `400`: Token đã hết hạn
  ```json
  {
    "statusCode": 400,
    "message": "Token đã hết hạn",
    "errors": null
  }
  ```
- `400`: Mật khẩu mới không đủ mạnh
  ```json
  {
    "statusCode": 400,
    "message": "Mật khẩu không đủ mạnh",
    "errors": ["Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"]
  }
  ```

### 3.7. Đăng Nhập bằng Google
- **Endpoint**: `POST /auth/login/google`
- **Mô tả**: Đăng nhập hoặc đăng ký mới bằng tài khoản Google

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Login with Google"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/auth/login/google`
5. Tab Headers: Thêm header `Content-Type: application/json`
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "idToken": "{{googleIdToken}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('user');
    pm.expect(jsonData.metadata).to.have.property('tokens');
    pm.expect(jsonData.metadata.tokens).to.have.property('accessToken');
    pm.expect(jsonData.metadata.tokens).to.have.property('refreshToken');
});

// Lưu tokens vào biến môi trường
const response = pm.response.json();
if (response.metadata && response.metadata.tokens) {
    pm.environment.set("token", response.metadata.tokens.accessToken);
    pm.environment.set("refreshToken", response.metadata.tokens.refreshToken);
    
    // Lưu userId 
    if (response.metadata.user && response.metadata.user._id) {
        pm.environment.set("userId", response.metadata.user._id);
    }
}
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmOTc3N2E2MGM..."
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Đăng nhập Google thành công",
    "metadata": {
      "user": {
        "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
        "email": "user@gmail.com",
        "name": "User Name",
        "avatar": "https://lh3.googleusercontent.com/a/...",
        "googleId": "109774751081082395795",
        "provider": "google"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: ID token hợp lệ từ Google
2. **Đăng ký mới**: Người dùng chưa tồn tại trong hệ thống
3. **Đăng nhập**: Người dùng đã tồn tại (theo email hoặc googleId)
4. **Token không hợp lệ**: ID token không hợp lệ hoặc hết hạn

#### Possible Errors:
- `401`: Token không hợp lệ
  ```json
  {
    "statusCode": 401,
    "message": "Google token không hợp lệ",
    "errors": null
  }
  ```
- `400`: Token không đúng định dạng
  ```json
  {
    "statusCode": 400,
    "message": "ID token là trường bắt buộc",
    "errors": null
  }
  ```

### 3.8. Liên kết tài khoản Google
- **Endpoint**: `POST /users/link/google`
- **Mô tả**: Liên kết tài khoản Google với tài khoản người dùng hiện tại

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Link Google Account"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/users/link/google`
5. Tab Headers: Thêm headers:
   ```
   Content-Type: application/json
   Authorization: Bearer {{token}}
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "idToken": "{{googleIdToken}}"
   }
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('googleId');
});
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{token}}
  ```
- **Request Body**:
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZmOTc3N2E2MGM..."
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Liên kết tài khoản Google thành công",
    "metadata": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "email": "user@example.com",
      "name": "Test User",
      "googleId": "109774751081082395795",
      "provider": "local",
      "providerData": {
        "google": {
          "sub": "109774751081082395795",
          "email": "user@gmail.com",
          "name": "User Name",
          "picture": "https://lh3.googleusercontent.com/a/..."
        }
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Liên kết tài khoản Google mới
2. **Đã liên kết**: Cố gắng liên kết tài khoản đã được liên kết
3. **Email xung đột**: Google email khác với email tài khoản

#### Possible Errors:
- `401`: Chưa xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Token không hợp lệ hoặc đã hết hạn",
    "errors": null
  }
  ```
- `409`: Đã liên kết
  ```json
  {
    "statusCode": 409,
    "message": "Tài khoản này đã được liên kết với Google",
    "errors": null
  }
  ```
- `409`: Xung đột
  ```json
  {
    "statusCode": 409,
    "message": "Tài khoản Google này đã được liên kết với tài khoản khác",
    "errors": null
  }
  ```

### 3.9. Hủy liên kết tài khoản Google
- **Endpoint**: `DELETE /users/unlink/google`
- **Mô tả**: Hủy liên kết tài khoản Google khỏi tài khoản người dùng hiện tại

#### Setup
1. Trong folder "Authentication", tạo request mới
2. Đặt tên: "Unlink Google Account"
3. Chọn phương thức: DELETE
4. URL: `{{baseUrl}}/users/unlink/google`
5. Tab Headers: Thêm header:
   ```
   Authorization: Bearer {{token}}
   ```

#### Test Script
Thêm script sau vào tab "Tests":
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('success', true);
});
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Authorization: Bearer {{token}}
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Đã hủy liên kết với google",
    "metadata": {
      "success": true,
      "message": "Đã hủy liên kết với google"
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Hủy liên kết tài khoản đã liên kết
2. **Chưa liên kết**: Cố gắng hủy liên kết tài khoản chưa được liên kết
3. **Không có mật khẩu**: Cố gắng hủy liên kết khi tài khoản chưa có mật khẩu

#### Possible Errors:
- `401`: Chưa xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Token không hợp lệ hoặc đã hết hạn",
    "errors": null
  }
  ```
- `400`: Chưa liên kết
  ```json
  {
    "statusCode": 400,
    "message": "Tài khoản này chưa được liên kết với google",
    "errors": null
  }
  ```
- `400`: Không có mật khẩu
  ```json
  {
    "statusCode": 400,
    "message": "Không thể hủy liên kết khi chưa thiết lập mật khẩu. Vui lòng thiết lập mật khẩu trước.",
    "errors": null
  }
  ```

## 4. Các Flow Kiểm Thử

### 4.4. Flow OAuth - Liên kết - Hủy liên kết
1. **Đăng nhập thông thường**: Đăng nhập bằng email/password
2. **Liên kết Google**: Liên kết tài khoản Google với tài khoản hiện tại
3. **Hủy liên kết Google**: Hủy bỏ liên kết Google
4. **Đăng nhập Google**: Đăng nhập lại bằng Google (tạo tài khoản mới)

Để thực hiện flow này trong Postman:
1. Tạo folder "OAuth Flow" trong folder "Authentication"
2. Thêm các request: Login, Link Google Account, Unlink Google Account, Login with Google
3. Chạy folder theo thứ tự

---

**Cập nhật lần cuối**: 2024-04-20 