# Tổng Quan Kiểm Thử API với Postman

## 1. Giới Thiệu

Tài liệu này cung cấp hướng dẫn chi tiết về cách kiểm thử tất cả API endpoints của hệ thống PSN-BE sử dụng Postman. Các hướng dẫn được tổ chức theo từng nhóm chức năng (feature) và từng API endpoint cụ thể.

## 2. Cài Đặt & Chuẩn Bị

### 2.1 Yêu Cầu

- Postman (phiên bản mới nhất)
- Collection PSN-BE API (tệp JSON đính kèm trong thư mục này)
- Môi trường (environment) test phù hợp
- Node.js (v14+ khuyến nghị)
- MongoDB (cài đặt cục bộ hoặc kết nối đến MongoDB Atlas)
- Firebase account (cho chức năng lưu trữ)

### 2.2 Thiết Lập Môi Trường Dự Án

Trước khi bắt đầu test API, bạn cần cài đặt môi trường dự án như sau:

#### Bước 1: Clone dự án
```bash
git clone https://github.com/yourusername/PSN-BE.git
cd PSN-BE
```

#### Bước 2: Cài đặt dependencies
```bash
npm install
```

#### Bước 3: Tạo file .env
Tạo file `.env` trong thư mục gốc dự án với các biến môi trường sau:

```
# Môi trường (dev/prod)
NODE_ENV = dev

# Server Configuration
DEV_APP_PORT = 3052
PROD_APP_PORT = 3000

# MongoDB Configuration - Local
DEV_DB_PROTOCOL = mongodb://localhost/27017
DEV_DB_PORT = 27017
DEV_DB_NAME = shopDEV

# MongoDB Configuration - Atlas
DEV_DB_PROTOCOL = mongodb+srv
DEV_DB_USERNAME = your_username
DEV_DB_PASSWORD = your_password
DEV_DB_NAME = @cluster.mongodb.net/?retryWrites=true&w=majority&appName=appname&dbname=dbname

# Firebase Configuration
FIREBASE_API_KEY = your_api_key
FIREBASE_AUTH_DOMAIN = your_project_id.firebaseapp.com
FIREBASE_DATABASE_URL = https://your_project_id-default-rtdb.region.firebasedatabase.app
FIREBASE_PROJECT_ID = your_project_id
FIREBASE_STORAGE_BUCKET = your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID = your_sender_id
FIREBASE_APP_ID = your_app_id
FIREBASE_MEASUREMENT_ID = your_measurement_id

# Background Removal Options (for image processing)
SKIP_BG_REMOVAL = false
BG_REMOVAL_MODEL = medium
```

**Quan trọng**: Đảm bảo thay thế giá trị mẫu bằng thông tin thực tế của bạn.

#### Bước 4: Khởi chạy server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ khởi chạy tại `http://localhost:3052` (dev) hoặc `http://localhost:3000` (prod).

### 2.3 Thiết Lập Môi Trường Postman

Trong Postman, bạn cần thiết lập các môi trường sau:

#### A. Development Environment

1. Mở Postman và nhấp vào "Environments" (góc bên trái)
2. Nhấp "New" để tạo môi trường mới
3. Đặt tên môi trường là "PSN-BE Development"
4. Thêm các biến môi trường sau:

| Biến          | Giá trị ban đầu                | Giá trị hiện tại              | Mô tả                           |
|---------------|--------------------------------|--------------------------------|----------------------------------|
| baseUrl       | http://localhost:3052/api/v1   | http://localhost:3052/api/v1   | URL cơ sở của API               |
| token         |                                |                                | Lưu JWT access token            |
| refreshToken  |                                |                                | Lưu JWT refresh token           |
| userId        |                                |                                | ID của người dùng đã đăng nhập  |
| testEmail     | test@example.com              | test@example.com               | Email test                       |
| testPassword  | Test@123456                    | Test@123456                    | Mật khẩu test                    |

5. Nhấp "Save" để lưu môi trường

#### B. Production Environment

1. Tạo môi trường mới với tên "PSN-BE Production"
2. Thêm các biến môi trường tương tự nhưng với baseUrl là URL production

#### C. Thiết Lập Pre-request Script

Đối với collection, bạn có thể thêm pre-request script để tự động xử lý refresh token:

```javascript
// Kiểm tra nếu token hết hạn
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

## 3. Bản Đồ API (API Map)

Hệ thống PSN-BE được tổ chức thành các nhóm API sau:

### 3.1. Authentication
- **File hướng dẫn chi tiết**: [auth-api-testing.md](./auth-api-testing.md)
- **Endpoints**:
  - `POST /auth/signup`: Đăng ký tài khoản mới
  - `POST /auth/login`: Đăng nhập
  - `POST /auth/logout`: Đăng xuất
  - `POST /auth/refresh-token`: Làm mới token
  - `POST /auth/change-password`: Đổi mật khẩu
  - `POST /auth/forgot-password`: Quên mật khẩu
  - `POST /auth/reset-password`: Đặt lại mật khẩu

### 3.2. Users
- **File hướng dẫn chi tiết**: [users-api-testing.md](./users-api-testing.md)
- **Endpoints**:
  - `GET /users/profile`: Lấy thông tin profile
  - `PUT /users/profile`: Cập nhật profile
  - `GET /users/:id`: Lấy thông tin người dùng theo ID
  - `GET /users`: Lấy danh sách người dùng (admin)
  - `PATCH /users/:id/status`: Thay đổi trạng thái người dùng (admin)

### 3.3. Outfits
- **File hướng dẫn chi tiết**: [outfit-api-testing.md](./outfit-api-testing.md)
- **Endpoints**:
  - `POST /outfits`: Tạo trang phục mới
  - `GET /outfits`: Lấy danh sách trang phục
  - `GET /outfits/:id`: Lấy chi tiết trang phục
  - `PUT /outfits/:id`: Cập nhật trang phục
  - `DELETE /outfits/:id`: Xóa trang phục
  - `POST /outfits/:id/worn`: Đánh dấu trang phục đã mặc
  - `POST /outfits/:id/items/:itemId`: Thêm item vào trang phục
  - `DELETE /outfits/:id/items/:itemId`: Xóa item khỏi trang phục
  - `GET /outfits/weather`: Lấy trang phục phù hợp với thời tiết
  - `GET /outfits/statistics`: Lấy thống kê về trang phục

### 3.4. Style Rules
- **File hướng dẫn chi tiết**: [style-rule-api-testing.md](./style-rule-api-testing.md)
- **Endpoints**:
  - `POST /style-rules`: Tạo quy tắc phong cách mới
  - `GET /style-rules`: Lấy danh sách quy tắc phong cách
  - `GET /style-rules/:id`: Lấy chi tiết quy tắc phong cách
  - `PUT /style-rules/:id`: Cập nhật quy tắc phong cách
  - `DELETE /style-rules/:id`: Xóa quy tắc phong cách
  - `POST /style-rules/validate-outfit`: Đánh giá trang phục theo quy tắc
  - `GET /style-rules/metadata`: Lấy metadata quy tắc phong cách

### 3.5. Posts
- **File hướng dẫn chi tiết**: [posts-api-testing.md](./posts-api-testing.md)
- **Endpoints**:
  - `POST /posts`: Tạo bài viết mới
  - `GET /posts`: Lấy danh sách bài viết
  - `GET /posts/:id`: Lấy chi tiết bài viết theo ID
  - `PUT /posts/:id`: Cập nhật bài viết
  - `DELETE /posts/:id`: Xóa bài viết
  - `POST /posts/:id/like`: Thích bài viết
  - `DELETE /posts/:id/like`: Bỏ thích bài viết

### 3.6. Comments
- **File hướng dẫn chi tiết**: [comments-api-testing.md](./comments-api-testing.md)
- **Endpoints**:
  - `POST /posts/:postId/comments`: Thêm bình luận vào bài viết
  - `GET /posts/:postId/comments`: Lấy danh sách bình luận của bài viết
  - `PUT /comments/:id`: Cập nhật bình luận
  - `DELETE /comments/:id`: Xóa bình luận

### 3.7. Media
- **File hướng dẫn chi tiết**: [media-api-testing.md](./media-api-testing.md)
- **Endpoints**:
  - `POST /media/upload`: Tải lên file media
  - `GET /media/:id`: Lấy thông tin media
  - `DELETE /media/:id`: Xóa media

### 3.8. Notifications
- **File hướng dẫn chi tiết**: [notifications-api-testing.md](./notifications-api-testing.md)
- **Endpoints**:
  - `GET /notifications`: Lấy danh sách thông báo
  - `PATCH /notifications/:id/read`: Đánh dấu thông báo đã đọc
  - `PATCH /notifications/read-all`: Đánh dấu tất cả thông báo đã đọc

## 4. Hướng Dẫn Sử Dụng

### 4.1. Import Collection

1. Mở Postman
2. Nhấp vào "Import" ở góc trên bên trái
3. Chọn file `PSN-BE-API-Collection.json` đính kèm
4. Cấu hình môi trường bằng cách nhập vào các biến môi trường

### 4.2. Authentication Setup

Trước khi test các API khác, bạn cần xác thực và lấy access token:

1. Tạo tài khoản mới qua API `POST /auth/signup` hoặc sử dụng tài khoản có sẵn
2. Đăng nhập qua API `POST /auth/login` với thông tin đăng nhập hợp lệ
3. Token sẽ được tự động lưu vào biến môi trường `token` và `refreshToken` nhờ test script
4. Sau khi có token, bạn có thể gọi các API được bảo vệ khác

### 4.3. Flow Kiểm Thử Cơ Bản

Để kiểm thử đầy đủ, hãy tuân theo các luồng sau:

1. **Authentication Flow**:
   - Đăng ký → Đăng nhập → Làm mới token → Đăng xuất
   
2. **User Flow**:
   - Đăng nhập → Xem profile → Cập nhật profile
   
3. **Post Flow**:
   - Đăng nhập → Tạo bài viết → Lấy chi tiết → Cập nhật → Thích → Bỏ thích → Xóa
   
4. **Comment Flow**:
   - Đăng nhập → Tạo bài viết → Thêm bình luận → Cập nhật bình luận → Xóa bình luận

### 4.4. Xử Lý Lỗi & Debugging API

Khi gặp lỗi khi test API, hãy:

1. Kiểm tra **Status Code** và **Response Body** để xác định loại lỗi
2. Kiểm tra **Request Headers**, đặc biệt là `Authorization` header
3. Kiểm tra **Request Body** có đúng định dạng không
4. Xem **Console** của Postman để tìm lỗi trong pre-request scripts hoặc test scripts
5. Kiểm tra logs từ server API (terminal hoặc file logs)

### 4.5. Testing Tự Động với Collection Runner

Postman Collection Runner cho phép bạn chạy tự động nhiều requests theo thứ tự:

1. Nhấp vào "..." bên cạnh collection và chọn "Run collection"
2. Chọn các requests cần chạy
3. Đặt iterations và delay
4. Nhấp "Run" để bắt đầu

## 5. Báo Cáo Vấn Đề

Nếu phát hiện sự không nhất quán hoặc lỗi trong API:

1. Chụp ảnh màn hình response
2. Ghi lại request body và headers
3. Ghi chú rõ môi trường kiểm thử và phiên bản Postman
4. Báo cáo qua GitHub Issues với template sau:
   ```
   ### Môi trường
   - Phiên bản Postman: [ví dụ: 10.0.0]
   - API Environment: [Development/Production]
   - Server version: [ví dụ: 1.0.0]
   
   ### Endpoint
   [ví dụ: POST /auth/login]
   
   ### Mô tả vấn đề
   [Mô tả chi tiết vấn đề]
   
   ### Request
   Headers: [Headers sử dụng]
   Body: [Body gửi đi]
   
   ### Response
   Status Code: [Ví dụ: 400]
   Body: [Response body]
   
   ### Hành vi mong đợi
   [Mô tả hành vi API mong đợi]
   ```

## 6. Biến Thể Và Trường Hợp Cần Lưu Ý

### 6.1. Rate Limiting

API có áp dụng rate limiting để chống lạm dụng. Giới hạn mặc định:
- 100 requests/phút cho các endpoint thông thường
- 10 requests/phút cho endpoint đăng nhập (chống brute force)

### 6.2. Trường Hợp Production

Trong môi trường production, một số đặc điểm khác biệt cần lưu ý:
- Reset token không được trả về trong response
- JWT có thời hạn ngắn hơn (15 phút)
- CORS hạn chế hơn

### 6.3. Bảo Mật

- Không lưu token trong collection public
- Không chia sẻ biến môi trường chứa thông tin đăng nhập
- Sử dụng các biến Postman thay vì hardcode giá trị nhạy cảm

## 7. Liên Kết Hữu Ích

- [Tài liệu API chính thức (Swagger)](#)
- [Repository GitHub của dự án](#)
- [Tài liệu Postman](https://learning.postman.com/docs/getting-started/introduction/)

---

**Cập nhật lần cuối**: 2023-11-01 