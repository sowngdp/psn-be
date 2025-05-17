# TDD Tổng Quan: Personal Style Network (PSN-BE)

## 1. Giới thiệu

### 1.1 Mục đích
Tài liệu này mô tả thiết kế kỹ thuật tổng thể của backend API cho ứng dụng Personal Style Network (PSN), một nền tảng quản lý tủ đồ thông minh và đề xuất trang phục dựa trên quy tắc phong cách cá nhân.

### 1.2 Phạm vi
Tài liệu này bao gồm kiến trúc hệ thống, thiết kế cơ sở dữ liệu, API endpoints, business logic, và kế hoạch triển khai cho toàn bộ dự án PSN-BE.

### 1.3 Tài liệu liên quan
- [Tầm nhìn kỹ thuật](../technical_vision.md)
- [Tổng quan dự án](../overview.md)
- [Task Overview](../TASK/00-overview.md)

## 2. Kiến trúc tổng thể

### 2.1 Kiến trúc ứng dụng
PSN-BE sử dụng kiến trúc multi-layer với các thành phần chính:

```
src/
├── api/                  # API Layer
│   ├── controllers/      # Xử lý request/response
│   ├── middleware/       # Middleware
│   ├── routes/           # API routes
│   └── validators/       # Validation
├── configs/              # Configuration
├── core/                 # Core components
│   ├── error.response.js # Error handling
│   └── success.response.js # Response formatting
├── db/                   # Data Access Layer
│   └── models/           # Mongoose schemas
├── services/             # Business Logic Layer
├── utils/                # Utilities
└── helpers/              # Helper functions
```

### 2.2 Luồng dữ liệu
1. Client gửi request đến API endpoints
2. Request được xử lý qua các middleware (auth, validation)
3. Controllers nhận request và gọi services tương ứng
4. Services thực hiện business logic và tương tác với database qua models
5. Kết quả được trả về cho client qua controllers với format chuẩn

### 2.3 Công nghệ sử dụng
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Firebase Storage
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Logging**: Winston
- **Security**: Helmet, CORS, etc.

## 3. Cơ sở dữ liệu

### 3.1 Mô hình dữ liệu
Dưới đây là các entity chính trong hệ thống:

- **User**: Thông tin người dùng
- **Item**: Vật phẩm trong tủ đồ
- **Outfit**: Trang phục (kết hợp nhiều Items)
- **StyleRule**: Quy tắc phong cách
- **Event**: Sự kiện sử dụng outfit
- **WearingHistory**: Lịch sử sử dụng
- **Schedule**: Lịch sử dụng trang phục
- **Notification**: Thông báo cho người dùng
- **ActivityLog**: Ghi lại hoạt động của người dùng

### 3.2 Quan hệ giữa các entity
- User 1:N Items (Một người dùng có nhiều vật phẩm)
- User 1:N Outfits (Một người dùng có nhiều outfit)
- User 1:N StyleRules (Người dùng có nhiều quy tắc phong cách)
- Outfit N:M Items (Một outfit gồm nhiều items, một item có thể thuộc nhiều outfit)
- StyleRule N:M Items (Quy tắc áp dụng cho nhiều items)
- User 1:N Events (Người dùng có nhiều sự kiện)
- Event 1:N Outfits (Một sự kiện có thể gắn với nhiều outfit)
- User 1:N Schedules (Người dùng có nhiều lịch)
- User 1:N Notifications (Người dùng có nhiều thông báo)
- User 1:N ActivityLogs (Người dùng có nhiều logs hoạt động)

## 4. Kế hoạch triển khai

### 4.1 Phân chia giai đoạn
Dự án được phân chia thành 6 giai đoạn:

1. **Core Infrastructure** ([Chi tiết](./02-core-infrastructure.md))
   - **Trạng thái**: ⏳ Đang refactoring
   - Thiết lập project structure
   - Authentication & Authorization
   - Core database models
   - Error handling & logging

2. **Quản lý tủ đồ cơ bản** ([Chi tiết](./03-wardrobe-management.md))
   - **Trạng thái**: ✅ Hoàn thành
   - CRUD cho vật phẩm
   - Upload và quản lý ảnh
   - Phân loại vật phẩm

3. **Outfit & Style Rules** ([Chi tiết](./04-outfit-stylerules.md))
   - **Trạng thái**: ✅ Hoàn thành
   - Tạo và quản lý outfit
   - Định nghĩa quy tắc phong cách
   - Áp dụng và đánh giá outfit

4. **Hệ thống đề xuất** ([Chi tiết](./05-recommendation-system.md))
   - **Trạng thái**: ✅ Hoàn thành
   - Đề xuất dựa trên quy tắc cơ bản
   - Tích hợp API thời tiết
   - Đề xuất theo dịp và mùa

5. **Lịch trình & Analytics** ([Chi tiết](./06-schedule-analytics.md))
   - **Trạng thái**: ⏳ Đang triển khai
   - Lên lịch sử dụng outfit
   - Theo dõi lịch sử sử dụng
   - Thống kê và báo cáo

6. **Tối ưu hóa & Mở rộng** ([Chi tiết](./07-optimization-extension.md))
   - **Trạng thái**: 🔄 Chưa bắt đầu
   - Performance optimization
   - Caching implementation
   - API versioning
   - Tính năng nâng cao

### 4.2 Thời gian dự kiến
- Giai đoạn 1: ⏳ Đang refactoring
- Giai đoạn 2: ✅ Hoàn thành
- Giai đoạn 3: ✅ Hoàn thành
- Giai đoạn 4: ✅ Hoàn thành
- Giai đoạn 5: ⏳ Đang triển khai (Dự kiến hoàn thành sau 1.5 tuần)
- Giai đoạn 6: 🔄 Chưa bắt đầu (Dự kiến 3 tuần)

Tổng thời gian còn lại: khoảng 4.5 tuần

## 5. Kết luận

Tài liệu này cung cấp một cái nhìn tổng quan về thiết kế kỹ thuật cho PSN-BE. Chi tiết cụ thể cho từng giai đoạn triển khai được mô tả trong các tài liệu TDD riêng biệt.

Hiện tại, dự án đã hoàn thành giai đoạn 2-4, đang trong quá trình triển khai giai đoạn 5 - Lịch trình & Analytics và đang refactoring giai đoạn 1 - Core Infrastructure. Các chức năng cốt lõi như quản lý người dùng, quản lý tủ đồ, outfit, quy tắc phong cách và hệ thống đề xuất đã hoàn thành. Các model cho giai đoạn 5 đã được tạo, đang cần tiếp tục triển khai services và API endpoints.

## 6. Lịch sử thay đổi

- 2023-XX-XX: Tạo tài liệu ban đầu
- 2023-XX-XX: Cập nhật trạng thái các giai đoạn dựa trên codebase hiện tại 