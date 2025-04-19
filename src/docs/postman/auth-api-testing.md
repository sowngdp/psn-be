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

## 4. Các Flow Kiểm Thử

### 4.1. Flow Đăng Ký - Đăng Nhập - Đăng Xuất
1. **Đăng Ký**: Tạo tài khoản mới thông qua API `/auth/signup`
2. **Đăng Nhập**: Đăng nhập với tài khoản vừa tạo qua API `/auth/login`, lưu token
3. **Đăng Xuất**: Đăng xuất qua API `/auth/logout`, xóa token

Để thực hiện flow này trong Postman:
1. Tạo một folder "Auth Flow 1" bên trong folder "Authentication"
2. Thêm các request vào folder theo thứ tự: Đăng ký, Đăng nhập, Đăng xuất
3. Chạy folder để thực hiện toàn bộ flow, hoặc sử dụng Collection Runner

### 4.2. Flow Đăng Nhập - Refresh Token
1. **Đăng Nhập**: Đăng nhập và lưu refresh token
2. **Refresh Token**: Dùng refresh token để lấy access token mới
3. **Kiểm Tra Access Token**: Sử dụng access token mới để gọi API được bảo vệ

Để thực hiện trong Postman:
1. Tạo folder "Auth Flow 2" trong folder "Authentication"
2. Thêm các request: Đăng nhập, Refresh Token, GET /users/profile (hoặc bất kỳ API nào yêu cầu xác thực)
3. Chạy folder theo thứ tự

### 4.3. Flow Quên - Đặt Lại Mật Khẩu
1. **Quên Mật Khẩu**: Gửi yêu cầu quên mật khẩu, nhận token reset
2. **Đặt Lại Mật Khẩu**: Sử dụng token để đặt mật khẩu mới
3. **Đăng Nhập với Mật Khẩu Mới**: Kiểm tra mật khẩu mới có hoạt động không

Để thực hiện trong Postman:
1. Tạo folder "Auth Flow 3" trong folder "Authentication"
2. Thêm các request: Quên Mật Khẩu, Đặt Lại Mật Khẩu, Đăng Nhập (với mật khẩu mới)
3. Chạy folder theo thứ tự

## 5. Các Tình Huống Nâng Cao

### 5.1. Kiểm Tra Bảo Mật Token
Để kiểm tra bảo mật token, thực hiện các test sau:

1. **Kiểm tra hết hạn token**:
   - Đăng nhập, lưu token
   - Đợi token hết hạn (có thể chỉnh sửa biến môi trường `tokenExpiry` để giả lập)
   - Thử sử dụng token đã hết hạn
   - Kiểm tra API trả về lỗi 401

2. **Kiểm tra token rotation**:
   - Đăng nhập, lưu refresh token
   - Dùng refresh token để lấy token mới
   - Thử dùng lại refresh token cũ
   - Kiểm tra API trả về lỗi 403 (token đã được sử dụng)

### 5.2. Kiểm Tra Rate Limiting
Để kiểm tra rate limiting:

1. Gửi nhiều request đăng nhập liên tiếp với thông tin không chính xác
2. Kiểm tra sau một số lần nhất định, API sẽ trả về lỗi 429 (Too Many Requests)
3. Chờ một khoảng thời gian và thử lại

### 5.3. Kiểm Tra Validation
Kiểm tra validation của các API:

1. **Mật khẩu yếu**:
   - Thử đăng ký/đổi mật khẩu với mật khẩu quá ngắn
   - Thử mật khẩu không có chữ hoa/chữ thường/số/ký tự đặc biệt
   - Kiểm tra thông báo lỗi chi tiết

2. **Email không hợp lệ**:
   - Thử đăng ký với email không đúng định dạng
   - Kiểm tra thông báo lỗi

## 6. Giải Quyết Vấn Đề Phổ Biến

### 6.1. Token Không Hoạt Động
Nếu token không hoạt động:

1. Kiểm tra định dạng Authorization header: `Bearer {{token}}`
2. Kiểm tra token có bị hết hạn không (xem biến `tokenExpiry`)
3. Thử refresh token hoặc đăng nhập lại
4. Kiểm tra logs server để biết lỗi chi tiết

### 6.2. Rate Limiting Khi Test
Khi gặp rate limiting:

1. Tăng thời gian chờ giữa các request
2. Sử dụng nhiều tài khoản test khác nhau
3. Trong môi trường development, có thể đề nghị tắt rate limiting

### 6.3. Reset Password Không Nhận Được Email
Trong môi trường development:

1. Kiểm tra resetToken trong response (thường được trả về trong development)
2. Kiểm tra logs server xem email đã được gửi không
3. Nếu dùng dịch vụ email giả lập (mailhog, mailtrap), kiểm tra inbox ở đó

---

**Cập nhật lần cuối**: 2023-11-01 