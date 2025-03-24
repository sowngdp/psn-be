# Personal Style Network API (PSN-BE)

Backend API cho ứng dụng Personal Style Network, một nền tảng quản lý tủ đồ thông minh và đề xuất trang phục dựa trên quy tắc phong cách cá nhân.

## 📖 Tổng quan dự án

Personal Style Network (PSN) là hệ thống giúp người dùng:

- **Quản lý kho trang phục cá nhân**: Lưu trữ và phân loại quần áo, phụ kiện
- **Tạo và lưu trữ các outfit**: Kết hợp các món đồ thành những bộ hoàn chỉnh
- **Nhận đề xuất thông minh**: Gợi ý trang phục phù hợp dựa trên thời tiết, sự kiện, mùa...
- **Áp dụng quy tắc phong cách**: Phân tích và đánh giá outfit dựa trên các nguyên tắc thời trang
- **Lên lịch sử dụng trang phục**: Theo dõi và lập kế hoạch sử dụng outfit

Backend API (PSN-BE) cung cấp toàn bộ chức năng nền tảng cho hệ thống Personal Style Network.

## 🛠️ Công nghệ sử dụng

- **Node.js** - Môi trường runtime JavaScript
- **Express.js** - Framework API RESTful
- **MongoDB** - Cơ sở dữ liệu NoSQL
- **Mongoose** - ODM cho MongoDB
- **JWT** - Xác thực và phân quyền
- **Bcrypt** - Mã hóa mật khẩu
- **Swagger** - Tài liệu API tự động
- **Jest** - Framework kiểm thử
- **ESLint & Prettier** - Kiểm tra và định dạng mã nguồn
- **Winston** - Logging framework
- **Redis** (Sắp triển khai) - Cache và quản lý phiên
- **Socket.IO** (Sắp triển khai) - Thông báo real-time

## 🗂️ Cấu trúc dự án

src/
├── api/                  # Tập trung các thành phần API
│   ├── controllers/      # Điều khiển xử lý request
│   ├── middleware/       # Middleware API
│   ├── routes/           # Định nghĩa API routes
│   └── validators/       # Xác thực dữ liệu đầu vào
├── auth/                 # Logic xác thực
│   ├── strategies/       # Các chiến lược xác thực
│   └── middleware/       # Middleware xác thực
├── config/               # Cấu hình ứng dụng
│   ├── db.js             # Cấu hình cơ sở dữ liệu
│   ├── env.js            # Cấu hình biến môi trường
│   └── app.js            # Cấu hình ứng dụng
├── core/                 # Thành phần cốt lõi
│   ├── error.response.js # Xử lý lỗi
│   └── success.response.js # Xử lý thành công
├── db/                   # Kết nối cơ sở dữ liệu
│   ├── models/           # Các mô hình dữ liệu
│   ├── repositories/     # Truy vấn cơ sở dữ liệu
│   └── seed/             # Dữ liệu khởi tạo
├── services/             # Logic nghiệp vụ
│   ├── user.service.js
│   ├── item.service.js
│   ├── outfit.service.js
│   └── recommendation.service.js
├── utils/                # Tiện ích chung
│   ├── helpers/          # Hàm trợ giúp
│   ├── constants/        # Hằng số
│   └── logger/           # Ghi log
├── tests/                # Kiểm thử
│   ├── unit/             # Unit test
│   ├── integration/      # Integration test
│   └── fixtures/         # Dữ liệu mẫu cho test
├── docs/                 # Tài liệu API
├── scripts/              # Scripts tiện ích
├── app.js                # Điểm khởi đầu ứng dụng
└── server.js             # Khởi tạo server


## 💡 Tính năng chính

### 1. Quản lý người dùng
- **Xác thực**: Đăng ký, đăng nhập, đặt lại mật khẩu
- **Hồ sơ cá nhân**: Quản lý thông tin người dùng, sở thích phong cách
- **Quản lý phiên làm việc**: JWT, refresh token, đăng xuất

### 2. Quản lý tủ đồ
- **CRUD vật phẩm**: Thêm, sửa, xóa, xem chi tiết quần áo và phụ kiện
- **Phân loại**: Phân loại theo màu sắc, loại, mùa, dịp...
- **Thống kê**: Theo dõi tần suất sử dụng, độ phổ biến

### 3. Quản lý trang phục (Outfit)
- **CRUD trang phục**: Tạo, cập nhật, xóa, xem chi tiết outfit
- **Kết hợp vật phẩm**: Thêm/xóa vật phẩm vào/khỏi outfit
- **Đánh dấu sử dụng**: Ghi nhận thời gian, dịp sử dụng

### 4. Hệ thống quy tắc phong cách
- **Định nghĩa quy tắc**: Tạo quy tắc về sự kết hợp màu sắc, họa tiết...
- **Đánh giá trang phục**: Phân tích outfit dựa trên quy tắc
- **Gợi ý cải thiện**: Đề xuất thay đổi để tối ưu outfit

### 5. Hệ thống đề xuất thông minh
- **Đề xuất theo dịp**: Gợi ý trang phục phù hợp với sự kiện
- **Đề xuất theo thời tiết**: Gợi ý trang phục phù hợp với điều kiện thời tiết
- **Đề xuất theo mùa**: Gợi ý trang phục phù hợp với mùa hiện tại
- **Đề xuất hàng ngày**: Gợi ý trang phục cho hoạt động thường ngày

### 6. Lịch trình sự kiện
- **Lên lịch outfit**: Lập kế hoạch sử dụng trang phục
- **Nhắc nhở**: Thông báo về kế hoạch sử dụng
- **Lịch sử**: Theo dõi lịch sử sử dụng trang phục

### 7. Phân tích sử dụng
- **Thống kê**: Phân tích tần suất sử dụng vật phẩm
- **Báo cáo**: Báo cáo về hiệu quả sử dụng tủ đồ
- **Đề xuất tối ưu**: Gợi ý để sử dụng tủ đồ hiệu quả hơn

## 🚀 Hướng dẫn cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js v16+
- MongoDB v4.4+
- npm v8+ hoặc yarn v1.22+

### Các bước cài đặt

1. **Clone dự án**:
   ```bash
   git clone https://github.com/yourusername/psn-be.git
   cd psn-be
   ```

2. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. **Tạo file môi trường**:
   ```bash
   cp .env.example .env
   ```

4. **Cấu hình môi trường**:
   Mở file `.env` và cấu hình các thông số:
   ```
   # Cấu hình ứng dụng
   PORT=3055
   NODE_ENV=development
   
   # Cấu hình MongoDB
   MONGODB_URI=mongodb://localhost:27017/personal-style-network
   
   # JWT Secret
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRATION=1d
   JWT_REFRESH_SECRET=your_refresh_secret_key
   JWT_REFRESH_EXPIRATION=7d
   
   # Các cấu hình khác
   API_VERSION=v1
   UPLOAD_DIR=./uploads
   ```

5. **Khởi tạo dữ liệu ban đầu** (nếu cần):
   ```bash
   npm run seed
   # hoặc
   yarn seed
   ```

6. **Chạy ứng dụng ở môi trường phát triển**:
   ```bash
   npm run dev
   # hoặc
   yarn dev
   ```

7. **Truy cập tài liệu API**:
   ```
   http://localhost:3055/api-docs
   ```

### Môi trường Production

1. **Build ứng dụng**:
   ```bash
   npm run build
   # hoặc
   yarn build
   ```

2. **Chạy ứng dụng**:
   ```bash
   npm start
   # hoặc
   yarn start
   ```

## 📚 API Endpoints

### Xác thực

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/v1/api/auth/signup` | Đăng ký người dùng mới |
| POST | `/v1/api/auth/login` | Đăng nhập |
| POST | `/v1/api/auth/logout` | Đăng xuất |
| POST | `/v1/api/auth/refresh` | Làm mới token |
| POST | `/v1/api/auth/request-reset` | Yêu cầu đặt lại mật khẩu |
| POST | `/v1/api/auth/reset-password` | Đặt lại mật khẩu |

### Người dùng

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| GET | `/v1/api/users/profile` | Lấy thông tin profile của người dùng hiện tại |
| PUT | `/v1/api/users/profile` | Cập nhật thông tin profile người dùng |
| GET | `/v1/api/users/{id}` | Lấy thông tin người dùng |
| PUT | `/v1/api/users/{id}` | Cập nhật thông tin người dùng |
| GET | `/v1/api/users` | Lấy danh sách người dùng (admin) |
| DELETE | `/v1/api/users/{id}` | Xóa người dùng (admin) |

### Vật phẩm (Items)

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/v1/api/items` | Tạo mới vật phẩm |
| GET | `/v1/api/items` | Lấy danh sách vật phẩm của người dùng |
| GET | `/v1/api/items/{id}` | Lấy thông tin chi tiết vật phẩm |
| PUT | `/v1/api/items/{id}` | Cập nhật thông tin vật phẩm |
| DELETE | `/v1/api/items/{id}` | Xóa vật phẩm |

### Trang phục (Outfits)

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/v1/api/outfits` | Tạo mới trang phục |
| GET | `/v1/api/outfits` | Lấy danh sách trang phục của người dùng |
| GET | `/v1/api/outfits/{id}` | Lấy thông tin chi tiết trang phục |
| PUT | `/v1/api/outfits/{id}` | Cập nhật thông tin trang phục |
| DELETE | `/v1/api/outfits/{id}` | Xóa trang phục |
| POST | `/v1/api/outfits/{id}/worn` | Đánh dấu trang phục đã mặc |
| POST | `/v1/api/outfits/{id}/items` | Thêm vật phẩm vào trang phục |
| DELETE | `/v1/api/outfits/{outfitId}/items/{itemId}` | Xóa vật phẩm khỏi trang phục |

### Quy tắc phong cách (Style Rules)

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/v1/api/style-rules` | Tạo quy tắc phong cách mới |
| GET | `/v1/api/style-rules` | Lấy danh sách quy tắc phong cách |
| GET | `/v1/api/style-rules/{id}` | Lấy thông tin quy tắc phong cách |
| PUT | `/v1/api/style-rules/{id}` | Cập nhật quy tắc phong cách |
| DELETE | `/v1/api/style-rules/{id}` | Xóa quy tắc phong cách |
| POST | `/v1/api/style-rules/evaluate` | Đánh giá trang phục theo quy tắc phong cách |

### Đề xuất (Recommendations)

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/v1/api/recommendations` | Tạo đề xuất mới |
| GET | `/v1/api/recommendations` | Lấy danh sách đề xuất của người dùng |
| GET | `/v1/api/recommendations/{id}` | Lấy thông tin chi tiết đề xuất |
| POST | `/v1/api/recommendations/{id}/feedback` | Cập nhật phản hồi người dùng cho đề xuất |
| POST | `/v1/api/recommendations/{id}/used` | Đánh dấu đề xuất đã được sử dụng |
| POST | `/v1/api/recommendations/occasion` | Tạo đề xuất dựa trên dịp |
| POST | `/v1/api/recommendations/weather` | Tạo đề xuất dựa trên thời tiết |
| POST | `/v1/api/recommendations/season` | Tạo đề xuất dựa trên mùa |

### Lịch trình (Schedules)

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| POST | `/v1/api/schedules` | Tạo lịch trình mới |
| GET | `/v1/api/schedules` | Lấy danh sách lịch trình của người dùng |
| GET | `/v1/api/schedules/{id}` | Lấy thông tin chi tiết lịch trình |
| PUT | `/v1/api/schedules/{id}` | Cập nhật lịch trình |
| DELETE | `/v1/api/schedules/{id}` | Xóa lịch trình |
| POST | `/v1/api/schedules/{id}/complete` | Đánh dấu lịch trình đã hoàn thành |

## 📘 Các giai đoạn phát triển

### Giai đoạn 1: Thiết lập cơ sở hạ tầng (✅ Hoàn thành)

**Mục tiêu**: Xây dựng nền tảng vững chắc cho dự án, với các thành phần cơ bản đảm bảo tính ổn định và bảo mật.

#### 1.1. Cấu hình cơ sở dữ liệu (✅)
- Thiết lập kết nối MongoDB tối ưu với cấu hình connection pooling
- Cấu hình biến môi trường (development, production, test)
- Thiết lập lớp trừu tượng cho database interaction (repositories)
- Xây dựng schema validation với Mongoose

#### 1.2. Hệ thống xác thực & bảo mật (✅)
- Triển khai JWT authentication với access và refresh token
- Xây dựng hệ thống phân quyền (RBAC)
- Phát triển chức năng đăng ký, đăng nhập, đăng xuất
- Cài đặt middleware xác thực cho các routes bảo mật
- Triển khai request rate limiting để phòng chống DoS

#### 1.3. Cấu trúc API (✅)
- Thiết kế RESTful API chuẩn
- Phát triển tài liệu API với Swagger/OpenAPI
- Cài đặt API versioning (v1, v2,...)
- Xây dựng hệ thống xử lý lỗi thống nhất
- Triển khai middleware validation các request

#### 1.4. Quản lý môi trường phát triển (✅)
- Thiết lập quy trình CI/CD cơ bản
- Cấu hình ESLint và Prettier cho code consistency
- Triển khai logging hệ thống với Winston
- Cấu hình CORS policy cho API
- Thiết lập môi trường test với Jest

**Kết quả đạt được**:
- Hạ tầng cơ sở vững chắc, sẵn sàng cho phát triển các tính năng
- API documentation đầy đủ và rõ ràng
- Hệ thống xác thực an toàn, bảo mật
- Code base sạch sẽ, được tổ chức tốt và dễ mở rộng

### Giai đoạn 2: Phát triển các tính năng cốt lõi (✅ Hoàn thành)

**Mục tiêu**: Phát triển các chức năng cơ bản của hệ thống, tạo nền tảng cho trải nghiệm người dùng thiết yếu.

#### 2.1. Quản lý người dùng (✅)
- Phát triển API CRUD đầy đủ cho User
- Triển khai UserStyleProfile với thông tin sở thích
- Xây dựng chức năng quản lý hồ sơ người dùng
- Phát triển tính năng đặt lại mật khẩu an toàn
- Cài đặt quy trình xác minh email (nếu cần)

#### 2.2. Quản lý tủ đồ (✅)
- Phát triển API CRUD cho Items (vật phẩm)
- Triển khai hệ thống phân loại đa dạng (loại, màu sắc, mùa...)
- Xây dựng chức năng tìm kiếm và lọc vật phẩm nâng cao
- Phát triển tính năng quản lý hình ảnh cho vật phẩm
- Cài đặt cơ chế theo dõi lịch sử sử dụng vật phẩm

#### 2.3. Quản lý trang phục (✅)
- Phát triển API CRUD cho Outfits
- Triển khai cơ chế kết hợp vật phẩm thành outfit
- Xây dựng chức năng đánh giá và ghi nhận việc sử dụng outfit
- Phát triển tính năng phân loại outfit theo dịp, mùa...
- Cài đặt cơ chế gắn thẻ và ghi chú cho outfit

#### 2.4. Hệ thống quy tắc phong cách (✅)
- Phát triển API CRUD cho StyleRule
- Triển khai engine đánh giá outfit dựa trên quy tắc
- Xây dựng các quy tắc phong cách cơ bản (màu sắc, pattern...)
- Phát triển cơ chế đánh giá điểm phong cách (style score)
- Cài đặt hệ thống đề xuất cải thiện outfit

#### 2.5. Hệ thống đề xuất cơ bản (✅)
- Phát triển API cho Recommendation
- Triển khai thuật toán đề xuất dựa trên quy tắc phong cách
- Xây dựng các loại đề xuất (daily, occasion, weather, season)
- Phát triển cơ chế phản hồi về đề xuất từ người dùng
- Cài đặt cơ sở theo dõi hiệu quả của các đề xuất

**Kết quả đạt được**:
- Người dùng có thể quản lý toàn diện tủ đồ, trang phục
- Hệ thống có khả năng đánh giá và đề xuất trang phục
- API đầy đủ cho các chức năng cốt lõi
- Nền tảng vững chắc cho các tính năng nâng cao tiếp theo

### Giai đoạn 3: Phát triển tính năng nâng cao (🔄 Đang thực hiện)

**Mục tiêu**: Mở rộng khả năng của hệ thống với các tính năng nâng cao, cải thiện trải nghiệm người dùng.

#### 3.1. Lịch trình và kế hoạch (🔄)
- Phát triển API CRUD cho Schedule
- Triển khai hệ thống lịch biểu trang phục theo sự kiện
- Xây dựng cơ chế nhắc nhở trước sự kiện
- Phát triển tính năng lập lịch tự động dựa trên lịch trình
- Cài đặt chức năng theo dõi kế hoạch và thực tế sử dụng

#### 3.2. Phản hồi và cải tiến hệ thống (🔄)
- Phát triển API cho FeedbackData
- Triển khai hệ thống thu thập phản hồi đa chiều
- Xây dựng cơ chế điều chỉnh đề xuất dựa trên phản hồi
- Phát triển tính năng cải thiện quy tắc phong cách từ dữ liệu sử dụng
- Cài đặt hệ thống báo cáo và phân tích phản hồi

#### 3.3. Thông báo và theo dõi hoạt động (🔄)
- Phát triển API cho Notification và ActivityLog
- Triển khai hệ thống thông báo real-time
- Xây dựng cơ chế theo dõi hoạt động người dùng
- Phát triển tính năng báo cáo hoạt động định kỳ
- Cài đặt cài đặt thông báo tùy chỉnh

#### 3.4. Thuật toán đề xuất nâng cao (🔄)
- Cải tiến thuật toán đề xuất với machine learning
- Triển khai cơ chế học từ hành vi người dùng
- Xây dựng hệ thống gợi ý cá nhân hóa cao
- Phát triển tính năng phân tích xu hướng sử dụng
- Cài đặt thuật toán dự đoán nhu cầu trang phục

**Kết quả mong đợi**:
- Hệ thống gợi ý thông minh, cá nhân hóa cao
- Trải nghiệm người dùng liền mạch với thông báo và nhắc nhở
- Khả năng học hỏi và thích nghi của hệ thống được nâng cao
- Người dùng nhận được giá trị cao từ việc lập kế hoạch trang phục

### Giai đoạn 4: Tối ưu hóa và mở rộng (⏳ Sắp tới)

**Mục tiêu**: Nâng cao hiệu suất hệ thống, tối ưu hóa trải nghiệm và mở rộng khả năng phục vụ.

#### 4.1. Tối ưu hiệu suất (⏳)
- Rà soát và tối ưu các truy vấn database
- Triển khai caching với Redis cho các truy vấn phổ biến
- Tối ưu hóa indexing cơ sở dữ liệu
- Triển khai lazy loading cho dữ liệu lớn
- Cải thiện thời gian phản hồi API

#### 4.2. Bảo mật nâng cao (⏳)
- Rà soát và nâng cấp hệ thống phân quyền
- Triển khai xác thực hai yếu tố (2FA)
- Phát triển cơ chế quét lỗ hổng tự động
- Xây dựng hệ thống giám sát hoạt động bất thường
- Tối ưu hóa rate limiting và DoS protection

#### 4.3. Khả năng mở rộng (⏳)
- Triển khai microservices (nếu cần)
- Phát triển khả năng cân bằng tải
- Xây dựng hệ thống auto-scaling
- Cải thiện khả năng phục hồi sau sự cố
- Tối ưu hóa quản lý tài nguyên

#### 4.4. Mở rộng tính năng (⏳)
- Phát triển API cho tính năng xã hội (chia sẻ, theo dõi...)
- Triển khai tích hợp với bên thứ ba (thời tiết, calendar...)

## Cài đặt MongoDB

### Windows
1. Tải MongoDB Community Server từ trang chủ: https://www.mongodb.com/try/download/community
2. Cài đặt theo hướng dẫn, tích chọn "Install MongoDB as a Service"
3. Khởi động MongoDB Compass để quản lý trực quan

### macOS
1. Sử dụng Homebrew:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu)
```bash
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

## Cấu hình và khởi động dự án

1. Tạo file môi trường từ mẫu:
```bash
cp .env.example .env
```

2. Chỉnh sửa file .env với thông tin kết nối phù hợp:
```
# Cấu hình ứng dụng
PORT=3055
NODE_ENV=development

# Cấu hình MongoDB
MONGODB_URI=mongodb://localhost:27017/personal-style-network

# JWT Secret
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=1d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRATION=7d

# Các cấu hình khác
API_VERSION=v1
UPLOAD_DIR=./uploads
```