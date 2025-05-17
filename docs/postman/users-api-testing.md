# Hướng Dẫn Kiểm Thử User API

## 1. Giới Thiệu

Tài liệu này cung cấp hướng dẫn chi tiết về cách kiểm thử tất cả các User API endpoints của hệ thống PSN-BE, bao gồm xem thông tin người dùng, quản lý profile, cập nhật thông tin người dùng và các chức năng quản trị.

## 2. Cài Đặt & Chuẩn Bị

### 2.1. Biến Môi Trường Đặc Biệt cho User API

Ngoài các biến môi trường chung được mô tả trong [Tổng quan](./api-testing-overview.md), API người dùng cần các biến sau:

| Biến | Mô tả |
|------|-------|
| `userId` | ID của người dùng test (thường được lưu sau khi đăng ký/đăng nhập) |
| `token` | Access token cho xác thực (lấy từ API login) |
| `testUserName` | Tên hiển thị mới khi cập nhật thông tin người dùng |
| `testBioContent` | Nội dung mô tả bản thân khi cập nhật thông tin người dùng |

### 2.2. Collection Setup

Để chuẩn bị cho việc test API User, hãy tạo một thư mục "Users" trong collection của bạn và thêm tất cả các API endpoint vào đó:

1. Nhấp chuột phải vào collection và chọn "Add Folder"
2. Đặt tên folder là "Users"
3. Thêm từng request vào folder này theo hướng dẫn bên dưới

## 3. Danh Sách API Endpoints

### 3.1. Lấy Profile Người Dùng Hiện Tại
- **Endpoint**: `GET /users/profile`
- **Mô tả**: Lấy thông tin profile của người dùng đang đăng nhập

#### Setup
1. Trong folder "Users", tạo request mới
2. Đặt tên: "Get Current User Profile"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/users/profile`
5. Tab Headers: Thêm header 
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
    pm.expect(jsonData.metadata).to.have.property('_id');
    pm.expect(jsonData.metadata).to.have.property('email');
});

// Lưu userId nếu chưa được lưu trước đó
const jsonData = pm.response.json();
if (jsonData.metadata && jsonData.metadata._id) {
    pm.environment.set("userId", jsonData.metadata._id);
    console.log("User ID saved: " + jsonData.metadata._id);
}
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Lấy thông tin profile thành công",
    "metadata": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "email": "user@example.com",
      "name": "Nguyễn Văn A",
      "avatar": "https://storage.example.com/avatar123.jpg",
      "phoneNumber": "0123456789",
      "bio": "Tôi là một người dùng thử nghiệm",
      "bodyType": "hourglass",
      "seasonPreferences": ["spring", "summer"],
      "favoriteColors": ["blue", "black"],
      "stylePreferences": ["casual", "formal"],
      "measurements": {
        "height": 165,
        "weight": 55,
        "bust": 90,
        "waist": 70,
        "hips": 90
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Token hợp lệ
2. **Không có token**: Không cung cấp token
3. **Token không hợp lệ**: Cung cấp token sai định dạng

#### Possible Errors:
- `401`: Không xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized - Invalid token",
    "errors": null
  }
  ```

### 3.2. Cập Nhật Thông Tin Profile
- **Endpoint**: `PUT /users/profile`
- **Mô tả**: Cập nhật thông tin profile của người dùng đang đăng nhập

#### Setup
1. Trong folder "Users", tạo request mới
2. Đặt tên: "Update User Profile"
3. Chọn phương thức: PUT
4. URL: `{{baseUrl}}/users/profile`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "bodyType": "hourglass",
     "seasonPreferences": ["spring", "summer"],
     "favoriteColors": ["blue", "black"],
     "stylePreferences": ["casual", "formal"],
     "measurements": {
       "height": 165,
       "weight": 55,
       "bust": 90,
       "waist": 70,
       "hips": 90
     }
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
    
    // Kiểm tra dữ liệu profile đã được cập nhật
    const profile = jsonData.metadata;
    const requestBody = JSON.parse(pm.request.body.raw);
    
    if (requestBody.bodyType) {
        pm.expect(profile).to.have.property('bodyType', requestBody.bodyType);
    }
    
    if (requestBody.measurements) {
        pm.expect(profile).to.have.property('measurements');
        if (requestBody.measurements.height) {
            pm.expect(profile.measurements).to.have.property('height', requestBody.measurements.height);
        }
    }
});
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
    "bodyType": "hourglass",
    "seasonPreferences": ["spring", "summer"],
    "favoriteColors": ["blue", "black"],
    "stylePreferences": ["casual", "formal"],
    "measurements": {
      "height": 165,
      "weight": 55,
      "bust": 90,
      "waist": 70,
      "hips": 90
    }
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Cập nhật profile thành công",
    "metadata": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "bodyType": "hourglass",
      "seasonPreferences": ["spring", "summer"],
      "favoriteColors": ["blue", "black"],
      "stylePreferences": ["casual", "formal"],
      "measurements": {
        "height": 165,
        "weight": 55,
        "bust": 90,
        "waist": 70,
        "hips": 90
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Cập nhật tất cả thông tin profile
2. **Cập nhật một phần**: Chỉ cập nhật một số thông tin
3. **Dữ liệu không hợp lệ**: Gửi dữ liệu không phù hợp với schema

#### Possible Errors:
- `400`: Dữ liệu không hợp lệ
  ```json
  {
    "statusCode": 400,
    "message": "Dữ liệu không hợp lệ",
    "errors": ["bodyType phải là một trong các giá trị: hourglass, pear, apple, rectangle, inverted_triangle"]
  }
  ```
- `401`: Không xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized - Invalid token",
    "errors": null
  }
  ```

### 3.3. Lấy Thông Tin Người Dùng Theo ID
- **Endpoint**: `GET /users/{id}`
- **Mô tả**: Lấy thông tin người dùng theo ID

#### Setup
1. Trong folder "Users", tạo request mới
2. Đặt tên: "Get User By ID"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/users/{{userId}}`
5. Tab Headers: Thêm header 
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
    
    // Kiểm tra ID người dùng khớp với ID được yêu cầu
    const userId = pm.request.url.path[1];
    pm.expect(jsonData.metadata).to.have.property('_id', userId);
});
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Lấy thông tin người dùng thành công",
    "metadata": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "email": "user@example.com",
      "name": "Nguyễn Văn A",
      "avatar": "https://storage.example.com/avatar123.jpg",
      "phoneNumber": "0123456789",
      "bio": "Tôi là một người dùng thử nghiệm"
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: ID người dùng hợp lệ
2. **ID không tồn tại**: ID không có trong hệ thống
3. **ID không hợp lệ**: ID sai định dạng

#### Possible Errors:
- `401`: Không xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized - Invalid token",
    "errors": null
  }
  ```
- `404`: Không tìm thấy người dùng
  ```json
  {
    "statusCode": 404,
    "message": "Không tìm thấy người dùng",
    "errors": null
  }
  ```

### 3.4. Cập Nhật Thông Tin Người Dùng
- **Endpoint**: `PUT /users/{id}`
- **Mô tả**: Cập nhật thông tin cơ bản của người dùng

#### Setup
1. Trong folder "Users", tạo request mới
2. Đặt tên: "Update User"
3. Chọn phương thức: PUT
4. URL: `{{baseUrl}}/users/{{userId}}`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "name": "{{testUserName}}",
     "phoneNumber": "0987654321",
     "address": "123 Đường ABC, Quận XYZ, TP. HCM",
     "bio": "{{testBioContent}}",
     "avatar": "https://storage.example.com/avatar_updated.jpg"
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
    
    // Kiểm tra thông tin đã được cập nhật
    const user = jsonData.metadata;
    const requestBody = JSON.parse(pm.request.body.raw);
    
    if (requestBody.name) {
        pm.expect(user).to.have.property('name', requestBody.name);
    }
    
    if (requestBody.phoneNumber) {
        pm.expect(user).to.have.property('phoneNumber', requestBody.phoneNumber);
    }
});
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
    "name": "Nguyễn Văn Updated",
    "phoneNumber": "0987654321",
    "address": "123 Đường ABC, Quận XYZ, TP. HCM",
    "bio": "Đây là bio mới của tôi",
    "avatar": "https://storage.example.com/avatar_updated.jpg"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Cập nhật thông tin người dùng thành công",
    "metadata": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "email": "user@example.com",
      "name": "Nguyễn Văn Updated",
      "avatar": "https://storage.example.com/avatar_updated.jpg",
      "phoneNumber": "0987654321",
      "address": "123 Đường ABC, Quận XYZ, TP. HCM",
      "bio": "Đây là bio mới của tôi"
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Cập nhật đầy đủ thông tin
2. **Cập nhật một phần**: Chỉ cập nhật một số trường
3. **ID không hợp lệ**: Cập nhật người dùng không tồn tại

#### Possible Errors:
- `400`: Dữ liệu không hợp lệ
  ```json
  {
    "statusCode": 400,
    "message": "Dữ liệu không hợp lệ",
    "errors": ["Số điện thoại không hợp lệ"]
  }
  ```
- `401`: Không xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized - Invalid token",
    "errors": null
  }
  ```
- `403`: Không có quyền
  ```json
  {
    "statusCode": 403,
    "message": "Không có quyền thực hiện hành động này",
    "errors": null
  }
  ```
- `404`: Không tìm thấy người dùng
  ```json
  {
    "statusCode": 404,
    "message": "Không tìm thấy người dùng",
    "errors": null
  }
  ```

### 3.5. Lấy Danh Sách Người Dùng (Admin)
- **Endpoint**: `GET /users`
- **Mô tả**: Lấy danh sách tất cả người dùng (chỉ dành cho admin)

#### Setup
1. Trong folder "Users", tạo request mới
2. Đặt tên: "Get All Users"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/users?page=1&limit=10&sort=ctime`
5. Tab Headers: Thêm header 
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
    
    // Kiểm tra cấu trúc pagination
    pm.expect(jsonData.metadata).to.have.property('users');
    pm.expect(jsonData.metadata).to.have.property('pagination');
    pm.expect(jsonData.metadata.pagination).to.have.property('totalDocs');
    pm.expect(jsonData.metadata.pagination).to.have.property('limit');
    pm.expect(jsonData.metadata.pagination).to.have.property('totalPages');
    pm.expect(jsonData.metadata.pagination).to.have.property('page');
    pm.expect(jsonData.metadata.pagination).to.have.property('pagingCounter');
    pm.expect(jsonData.metadata.pagination).to.have.property('hasPrevPage');
    pm.expect(jsonData.metadata.pagination).to.have.property('hasNextPage');
    
    // Kiểm tra dữ liệu người dùng
    pm.expect(jsonData.metadata.users).to.be.an('array');
});
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Lấy danh sách người dùng thành công",
    "metadata": {
      "users": [
        {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
          "email": "user1@example.com",
          "name": "Nguyễn Văn A",
          "role": "user",
          "status": "active",
          "createdAt": "2023-01-15T08:30:00Z"
        },
        {
          "_id": "65a1b2c3d4e5f6a7b8c9d0e2",
          "email": "user2@example.com",
          "name": "Trần Thị B",
          "role": "user",
          "status": "active",
          "createdAt": "2023-01-16T10:15:00Z"
        }
      ],
      "pagination": {
        "totalDocs": 50,
        "limit": 10,
        "totalPages": 5,
        "page": 1,
        "pagingCounter": 1,
        "hasPrevPage": false,
        "hasNextPage": true,
        "prevPage": null,
        "nextPage": 2
      }
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Admin token hợp lệ
2. **Regular User**: Thử với token người dùng thông thường
3. **Phân trang**: Thử với các tham số page, limit khác nhau
4. **Sắp xếp**: Thử với các tham số sort khác nhau

#### Possible Errors:
- `401`: Không xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized - Invalid token",
    "errors": null
  }
  ```
- `403`: Không có quyền admin
  ```json
  {
    "statusCode": 403,
    "message": "Forbidden - Admin access required",
    "errors": null
  }
  ```

### 3.6. Xóa Người Dùng (Admin)
- **Endpoint**: `DELETE /users/{id}`
- **Mô tả**: Xóa người dùng theo ID (chỉ dành cho admin)

#### Setup
1. Trong folder "Users", tạo request mới
2. Đặt tên: "Delete User"
3. Chọn phương thức: DELETE
4. URL: `{{baseUrl}}/users/{{userId}}`
5. Tab Headers: Thêm header 
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
    
    // Kiểm tra thông báo xóa thành công
    pm.expect(jsonData.message).to.include('thành công');
});
```

#### Ví Dụ Hoàn Chỉnh
- **Request Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Response Success (200)**:
  ```json
  {
    "statusCode": 200,
    "message": "Xóa người dùng thành công",
    "metadata": {
      "acknowledged": true,
      "deletedCount": 1
    }
  }
  ```

#### Các Trường Hợp Test
1. **Happy Path**: Xóa người dùng tồn tại bằng admin token
2. **Regular User**: Thử với token người dùng thông thường
3. **ID không tồn tại**: Xóa người dùng không tồn tại

#### Possible Errors:
- `401`: Không xác thực
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized - Invalid token",
    "errors": null
  }
  ```
- `403`: Không có quyền admin
  ```json
  {
    "statusCode": 403,
    "message": "Forbidden - Admin access required",
    "errors": null
  }
  ```
- `404`: Không tìm thấy người dùng
  ```json
  {
    "statusCode": 404,
    "message": "Không tìm thấy người dùng",
    "errors": null
  }
  ```

## 4. Các Flow Kiểm Thử

### 4.1. Flow Xem & Cập Nhật Profile
1. **Đăng Nhập**: Đăng nhập để lấy token xác thực
2. **Xem Profile**: Lấy thông tin profile hiện tại
3. **Cập Nhật Profile**: Cập nhật thông tin profile
4. **Kiểm Tra Profile**: Xem lại profile sau khi cập nhật

Để thực hiện flow này trong Postman:
1. Tạo một folder "User Profile Flow" bên trong folder "Users"
2. Thêm các request vào folder theo thứ tự: Login (từ Authentication), Get Current User Profile, Update User Profile, Get Current User Profile
3. Chạy folder để thực hiện toàn bộ flow, hoặc sử dụng Collection Runner

### 4.2. Flow Quản Lý Người Dùng (Admin)
1. **Đăng Nhập Admin**: Đăng nhập với tài khoản admin
2. **Xem Danh Sách**: Xem danh sách người dùng
3. **Xem Chi Tiết**: Xem thông tin chi tiết một người dùng
4. **Cập Nhật User**: Cập nhật thông tin người dùng
5. **Xóa User**: Xóa người dùng

Để thực hiện trong Postman:
1. Tạo folder "Admin User Management" trong folder "Users"
2. Thêm các request: Login (admin), Get All Users, Get User By ID, Update User, Delete User
3. Chạy folder theo thứ tự

## 5. Các Tình Huống Nâng Cao

### 5.1. Test Quyền Truy Cập
Để kiểm tra quyền truy cập API, thực hiện các test sau:

1. **Regular User vs Admin Endpoints**:
   - Đăng nhập với tài khoản người dùng thông thường
   - Thử gọi các API chỉ dành cho admin (Get All Users, Delete User)
   - Kiểm tra response trả về lỗi 403 Forbidden

2. **Cross-User Access**:
   - Đăng nhập với tài khoản A
   - Thử cập nhật thông tin của tài khoản B
   - Kiểm tra response trả về lỗi 403 Forbidden

### 5.2. Test Validation Dữ Liệu
Để kiểm tra validation dữ liệu, thử các tình huống sau:

1. **Invalid Profile Data**:
   - Gửi dữ liệu không hợp lệ trong Update Profile
   - Ví dụ: `bodyType` không thuộc các giá trị cho phép
   - Kiểm tra response trả về lỗi 400 Bad Request

2. **Invalid Measurements**:
   - Gửi các giá trị âm hoặc quá lớn cho các thông số đo
   - Kiểm tra response trả về lỗi validation

## 6. Monitor & Pre-request Script

### 6.1. Pre-request Script Kiểm Tra Token
Thêm script này vào tab Pre-request của các request yêu cầu xác thực để tự động làm mới token nếu hết hạn:

```javascript
// Kiểm tra xem token đã hết hạn chưa
const tokenExpiry = pm.environment.get("tokenExpiry");
if (tokenExpiry && new Date().getTime() > parseInt(tokenExpiry)) {
    // Gọi API refresh token
    pm.sendRequest({
        url: pm.environment.get("baseUrl") + "/auth/refresh-token",
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({ refreshToken: pm.environment.get("refreshToken") })
        }
    }, (err, res) => {
        if (!err && res.code === 200) {
            const response = res.json();
            if (response.metadata && response.metadata.tokens) {
                // Cập nhật token mới
                pm.environment.set("token", response.metadata.tokens.accessToken);
                pm.environment.set("refreshToken", response.metadata.tokens.refreshToken);
                
                // Thiết lập thời gian hết hạn (ví dụ: 1 giờ)
                const expiryTime = new Date().getTime() + 60 * 60 * 1000;
                pm.environment.set("tokenExpiry", expiryTime.toString());
            }
        }
    });
}
```

### 6.2. Biến Môi Trường Động
Tạo biến môi trường động để sử dụng trong các test:

```javascript
// Trong tab Tests của Login API
const userResponse = pm.response.json();
if (userResponse.metadata && userResponse.metadata.user) {
    const user = userResponse.metadata.user;
    
    // Lưu thông tin người dùng hiện tại
    pm.environment.set("currentUserEmail", user.email);
    pm.environment.set("currentUserName", user.name);
    
    // Tạo dữ liệu test ngẫu nhiên
    pm.environment.set("testUserName", user.name + " (Updated)");
    pm.environment.set("testBioContent", "Bio updated at " + new Date().toISOString());
}
```

## 7. Kết Luận

Tài liệu này cung cấp hướng dẫn chi tiết về cách kiểm thử các User API trong hệ thống PSN-BE. Bằng cách tuân theo các hướng dẫn và sử dụng các test script mẫu, bạn có thể đảm bảo API người dùng hoạt động chính xác và hiệu quả.

Hãy nhớ cập nhật tài liệu này khi có thay đổi trong API hoặc khi phát hiện các trường hợp test mới cần được thêm vào. 