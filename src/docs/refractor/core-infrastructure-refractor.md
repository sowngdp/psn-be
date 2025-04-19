# Core Infrastructure Refactoring Tasks

## 1. Mục Tiêu Refactoring

Dựa trên phân tích TDD và codebase hiện tại, giai đoạn 1 (Core Infrastructure) cần được refactoring để cải thiện cấu trúc dự án, tối ưu error handling, logging và bảo mật theo các best practices.

## 2. Các Vấn Đề Hiện Tại

### 2.1 Error Handling
- **Vấn đề**: Error handling hiện tại chưa nhất quán, sử dụng cả file error.response.js trong core và error.handler.js trong middlewares
- **Ảnh hưởng**: Dễ gây nhầm lẫn, trùng lặp mã và khó khăn trong việc bảo trì
- **Chi tiết**: 
  - HttpStatusCode được định nghĩa ở nhiều nơi (src/core/error.response.js, src/utils/httpStatusCode.js)
  - Xử lý lỗi trong middleware thiếu khả năng mở rộng cho các loại lỗi mới
  - Thiếu logging chi tiết cho error handling

### 2.2 Logging System
- **Vấn đề**: Hệ thống logging chưa được tích hợp đồng bộ
- **Ảnh hưởng**: Khó theo dõi lỗi và debug hệ thống
- **Chi tiết**:
  - Có hai cách tiếp cận logging khác nhau (src/utils/logger.js và src/utils/logger/index.js)
  - Thiếu cấu hình log rotation đầy đủ
  - Chưa có logging tập trung cho tất cả API calls và errors

### 2.3 Project Structure
- **Vấn đề**: Cấu trúc dự án chưa tối ưu cho việc mở rộng
- **Ảnh hưởng**: Khó khăn trong việc thêm tính năng mới và bảo trì
- **Chi tiết**:
  - Thư mục src/db chưa được tổ chức rõ ràng giữa models và repositories
  - Thiếu layer abstraction giữa services và models

### 2.4 Authentication & Security
- **Vấn đề**: Hệ thống xác thực cần cải thiện về mặt bảo mật
- **Ảnh hưởng**: Tiềm ẩn rủi ro bảo mật
- **Chi tiết**:
  - JWT management cần được tối ưu và an toàn hơn
  - Kiểm soát thời gian sống của token chưa tối ưu
  - Chiến lược refresh token cần được cải thiện

## 3. Nhiệm Vụ Refactoring

### 3.1 Chuẩn Hóa Error Handling
- [x] Thống nhất HttpStatusCode vào một file duy nhất (Completed)
- [x] Mở rộng error.response.js với các loại lỗi cụ thể cho business logic (Completed)
- [x] Cải thiện error.handler.js với khả năng xử lý tất cả loại lỗi (Completed)
- [x] Tích hợp logging với error handling (Completed)

### 3.2 Tối Ưu Logging System
- [x] Thống nhất logger implementation vào một module (Completed)
- [x] Cấu hình log rotation và log levels phù hợp (Completed)
- [x] Tạo middleware ghi log cho tất cả API requests/responses (Completed)
- [x] Thêm request ID vào logs để dễ dàng theo dõi (Completed)

### 3.3 Cải Thiện Project Structure
- [x] Tái cấu trúc thư mục src/db với repositories pattern (Completed)
- [x] Chuẩn hóa cách đặt tên file và thư mục trong toàn bộ dự án (Completed)
- [x] Tạo layer abstraction giữa services và models (Completed)
- [x] Thiết lập các interfaces rõ ràng giữa các layers (Completed)

### 3.4 Nâng Cao Authentication & Security
- [x] Tối ưu hóa JWT management (Completed)
- [x] Cải thiện cơ chế refresh token (Completed)
- [x] Thêm rate limiting chi tiết cho các endpoint nhạy cảm (Completed)
- [x] Triển khai các best practices bảo mật (helmet, CORS config) (Completed)

## 4. Quy Trình Thực Hiện

1. **Phân Tích**: Đánh giá chi tiết từng thành phần cần refactoring
2. **Lập Kế Hoạch**: Ưu tiên các nhiệm vụ theo mức độ quan trọng
3. **Thực Hiện**: Refactor từng phần với unit tests
4. **Kiểm Thử**: Đảm bảo tính năng hoạt động như cũ sau khi refactoring
5. **Tài Liệu Hóa**: Cập nhật tài liệu và comments trong code

## 5. Lịch Sử Thay Đổi

- 2023-XX-XX: Tạo tài liệu ban đầu
- 2023-XX-XX: Hoàn thành refactoring Error Handling và Logging System
- 2023-XX-XX: Hoàn thành refactoring Project Structure với Repository Pattern
- 2023-XX-XX: Hoàn thành refactoring Authentication & Security 