# Tài liệu tầm nhìn kỹ thuật - PSN-BE

> **Lưu ý**: Đây là tài liệu tầm nhìn tổng thể của dự án. Để xem chi tiết thiết kế kỹ thuật, vui lòng tham khảo thư mục `src/docs/TDD`.

## 1. Mục tiêu
PSN-BE hướng đến việc xây dựng một nền tảng API backend mạnh mẽ phục vụ ứng dụng Personal Style Network với các khả năng:
- Quản lý tủ đồ thông minh và phân loại trang phục
- Tạo và lưu trữ outfit, đánh giá theo quy tắc phong cách
- Đề xuất trang phục theo thời tiết, dịp, mùa và sở thích cá nhân
- Lên lịch sử dụng trang phục và phân tích thói quen

Đầu ra:
- API RESTful cung cấp đầy đủ chức năng
- Tài liệu API chi tiết qua Swagger
- Hệ thống xác thực và phân quyền an toàn
- Khả năng mở rộng và tối ưu hiệu suất

## 2. Người dùng và Use Cases
- **Người dùng ứng dụng (client):**
  - Đăng ký, đăng nhập tài khoản
  - Quản lý thông tin cá nhân và sở thích phong cách
  - Quản lý tủ đồ (thêm, sửa, xóa quần áo và phụ kiện)
  - Tạo, quản lý và đánh giá outfit
  - Nhận đề xuất trang phục theo ngữ cảnh
  - Lên lịch sử dụng trang phục
- **Nhà phát triển (developer):**
  - Tích hợp với frontend hoặc ứng dụng mobile
  - Truy cập tài liệu API
  - Kiểm tra và gỡ lỗi thông qua logs
- **Admin:**
  - Quản lý người dùng và dữ liệu hệ thống
  - Theo dõi metrics và hiệu suất
  - Quản lý quy tắc phong cách mặc định

## 3. Chức năng cần triển khai
- ### Xác thực và phân quyền
  - Đăng ký, đăng nhập, đăng xuất
  - Quản lý JWT và refresh token
  - Phân quyền người dùng/admin
  - Đặt lại mật khẩu và xác thực email
  
- ### Quản lý tủ đồ
  - CRUD vật phẩm (quần áo, phụ kiện)
  - Phân loại theo loại, màu sắc, mùa, dịp
  - Upload và xử lý ảnh (loại bỏ nền)
  - Đánh dấu tần suất sử dụng

- ### Quản lý outfit
  - Tạo và chỉnh sửa outfit từ vật phẩm
  - Đánh giá outfit theo quy tắc phong cách
  - Ghi lại lịch sử sử dụng
  - Chia sẻ outfit (tùy chọn)

- ### Hệ thống quy tắc phong cách
  - Định nghĩa quy tắc (màu sắc, họa tiết, kiểu dáng)
  - Áp dụng quy tắc để đánh giá outfit
  - Cá nhân hóa quy tắc theo sở thích người dùng

- ### Hệ thống đề xuất
  - Đề xuất theo thời tiết hiện tại/dự báo
  - Đề xuất theo dịp/sự kiện
  - Đề xuất theo mùa và xu hướng
  - Đề xuất dựa trên lịch sử và sở thích

- ### Lịch trình sử dụng
  - Lên lịch outfit cho sự kiện
  - Nhắc nhở kế hoạch sử dụng
  - Theo dõi lịch sử sử dụng

- ### Phân tích dữ liệu
  - Thống kê tần suất sử dụng vật phẩm
  - Báo cáo hiệu quả sử dụng tủ đồ
  - Gợi ý tối ưu hóa tủ đồ

## 4. Yêu cầu kỹ thuật
- **Backend:**
  - Node.js + Express.js làm framework chính
  - MVC architecture với tách biệt rõ ràng controllers, services, models
  - RESTful API design theo chuẩn
  - Middleware cho authentication, error handling, logging

- **Database:**
  - MongoDB với Mongoose ODM
  - Schema thiết kế hợp lý, normalized ở mức cần thiết
  - Indexes cho queries phổ biến
  - Data validation ở cả database và application level

- **Authentication:**
  - JWT (access token + refresh token)
  - Lưu trữ token an toàn
  - Rotation policy cho refresh token
  - Role-based access control

- **File Storage:**
  - Firebase Storage cho lưu trữ hình ảnh
  - Xử lý ảnh với background removal
  - Tối ưu hóa kích thước và chất lượng
  - Cache cho assets phổ biến

- **Caching (Future):**
  - Redis cho caching và session management
  - Cache invalidation strategy
  - Tunable TTL theo loại dữ liệu

- **Logging & Monitoring:**
  - Winston cho structured logging
  - Log levels phù hợp (error, warn, info, debug)
  - Log rotation và retention policy
  - Monitoring cho API performance

- **Security:**
  - Input validation và sanitization
  - Rate limiting và throttling
  - Protection against common attacks (CSRF, XSS, injection)
  - Secure headers (Helmet)
  - CORS configuration

- **Documentation:**
  - Swagger/OpenAPI cho API documentation
  - JSDoc cho code documentation
  - Tài liệu kỹ thuật cho developers

## 5. Thứ tự triển khai
1. **Giai đoạn 1: Core Infrastructure**
   - Thiết lập project structure
   - Authentication & Authorization
   - Core database models
   - Error handling & logging

2. **Giai đoạn 2: Quản lý tủ đồ cơ bản**
   - CRUD cho vật phẩm
   - Upload và quản lý ảnh
   - Phân loại vật phẩm

3. **Giai đoạn 3: Outfit & Style Rules**
   - Tạo và quản lý outfit
   - Định nghĩa quy tắc phong cách
   - Áp dụng và đánh giá outfit

4. **Giai đoạn 4: Hệ thống đề xuất**
   - Đề xuất dựa trên quy tắc cơ bản
   - Tích hợp API thời tiết
   - Đề xuất theo dịp và mùa

5. **Giai đoạn 5: Lịch trình & Analytics**
   - Lên lịch sử dụng outfit
   - Theo dõi lịch sử sử dụng
   - Thống kê và báo cáo

6. **Giai đoạn 6: Tối ưu hóa & Mở rộng**
   - Performance optimization
   - Caching implementation
   - API versioning
   - Tính năng nâng cao (sharing, social features) 