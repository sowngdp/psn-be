# PSN-BE (Personal Style Network Backend)

## Tổng quan
PSN-BE là API backend cho ứng dụng Personal Style Network, một nền tảng quản lý tủ đồ thông minh giúp người dùng tổ chức quần áo, tạo outfit, và nhận đề xuất phong cách dựa trên quy tắc phong cách cá nhân, điều kiện thời tiết, và các dịp khác nhau.

## Tính năng chính
- Xác thực người dùng và quản lý hồ sơ cá nhân
- Quản lý vật phẩm trong tủ đồ với xử lý hình ảnh và loại bỏ nền
- Tạo và quản lý outfit
- Định nghĩa quy tắc phong cách và đánh giá outfit
- Đề xuất outfit thông minh dựa trên thời tiết, dịp, và mùa
- Lên lịch sự kiện và lập kế hoạch sử dụng outfit
- Phân tích sử dụng và tối ưu hóa tủ đồ

## Công nghệ sử dụng
- **Môi trường runtime**: Node.js
- **Web Framework**: Express.js
- **Cơ sở dữ liệu**: MongoDB với Mongoose ODM
- **Xác thực**: JWT (JSON Web Tokens)
- **Lưu trữ file**: Firebase Storage
- **Xử lý hình ảnh**: Loại bỏ nền sử dụng thư viện @imgly
- **Tài liệu API**: Swagger
- **Bảo mật**: bcrypt, helmet
- **Ghi log**: Winston
- **Kiểm thử**: Jest

## Cấu trúc dự án
```
src/
├── api/                  # Các thành phần API
│   ├── controllers/      # Xử lý request
│   ├── middleware/       # Middleware API
│   ├── routes/           # Định nghĩa route API
│   └── validators/       # Xác thực dữ liệu đầu vào
├── configs/              # Cấu hình ứng dụng
│   ├── database.js       # Kết nối cơ sở dữ liệu
│   ├── env.js            # Biến môi trường
│   ├── jwt.js            # Cấu hình JWT
│   └── swagger.js        # Cấu hình tài liệu API
├── core/                 # Thành phần cốt lõi
│   ├── error.response.js # Xử lý lỗi
│   └── success.response.js # Phản hồi thành công
├── db/                   # Thành phần cơ sở dữ liệu
│   ├── models/           # Mô hình dữ liệu
│   └── seed/             # Dữ liệu khởi tạo
├── helpers/              # Hàm trợ giúp
├── keys/                 # Khóa và chứng chỉ
├── services/             # Logic nghiệp vụ
│   ├── auth.service.js
│   ├── background-removal.service.js
│   ├── firebase.service.js
│   ├── item.service.js
│   ├── key-token.service.js
│   ├── outfit.service.js
│   ├── recommendation.service.js
│   ├── storage.service.js
│   ├── style-rule.service.js
│   └── user.service.js
├── utils/                # Tiện ích
├── app.js                # Thiết lập ứng dụng Express
└── server.js             # Điểm khởi đầu server
```

## Bắt đầu
1. **Yêu cầu hệ thống**:
   - Node.js v16+
   - MongoDB v4.4+
   - npm v8+ hoặc yarn v1.22+

2. **Cài đặt**:
   ```bash
   git clone <repository-url>
   cd psn-be
   npm install
   ```

3. **Thiết lập môi trường**:
   - Sao chép `.env.example` thành `.env`
   - Cấu hình kết nối cơ sở dữ liệu, JWT secrets và các cài đặt khác

4. **Chạy server phát triển**:
   ```bash
   npm run dev
   ```

5. **Tài liệu API**:
   - Có sẵn tại endpoint `/api-docs`

## API Endpoints
API được tổ chức theo nguyên tắc RESTful với các tài nguyên chính sau:

- **Xác thực**: Đăng ký người dùng, đăng nhập, làm mới token
- **Người dùng**: Quản lý hồ sơ cá nhân
- **Vật phẩm**: Quản lý quần áo trong tủ đồ
- **Outfit**: Tạo và quản lý outfit
- **Quy tắc phong cách**: Định nghĩa quy tắc phong cách cá nhân
- **Đề xuất**: Gợi ý outfit bằng AI

## Quy trình phát triển
1. Thay đổi mã nguồn
2. Chạy kiểm thử: `npm test`
3. Kiểm tra mã nguồn: `npm run lint`
4. Tài liệu hóa thay đổi API trong Swagger
5. Khởi động server phát triển: `npm run dev`

## Triển khai
Triển khai cho môi trường sản xuất:
```bash
npm start
``` 