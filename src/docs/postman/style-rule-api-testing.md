# Hướng Dẫn Kiểm Thử Style Rule API

## 1. Giới Thiệu

Tài liệu này cung cấp hướng dẫn chi tiết về cách kiểm thử tất cả các Style Rule API endpoints của hệ thống PSN-BE, bao gồm tạo mới, xem, cập nhật, xóa các quy tắc phong cách và đánh giá trang phục dựa trên các quy tắc.

## 2. Cài Đặt & Chuẩn Bị

### 2.1. Biến Môi Trường Đặc Biệt cho Style Rule API

Ngoài các biến môi trường chung được mô tả trong [Tổng quan](./api-testing-overview.md), API style rule cần các biến sau:

| Biến | Mô tả |
|------|-------|
| `styleRuleId` | ID của style rule test (tự động lưu sau khi tạo style rule) |
| `outfitId` | ID của một outfit để đánh giá dựa trên style rules |
| `token` | Access token cho xác thực (lấy từ API login) |

### 2.2. Collection Setup

Để chuẩn bị cho việc test API Style Rule, hãy tạo một thư mục "StyleRules" trong collection của bạn và thêm tất cả các API endpoint vào đó:

1. Nhấp chuột phải vào collection và chọn "Add Folder"
2. Đặt tên folder là "StyleRules"
3. Thêm từng request vào folder này theo hướng dẫn bên dưới

## 3. Danh Sách API Endpoints

### 3.1. Tạo Mới Style Rule
- **Endpoint**: `POST /style-rules`
- **Mô tả**: Tạo một quy tắc phong cách mới

#### Setup
1. Trong folder "StyleRules", tạo request mới
2. Đặt tên: "Create Style Rule"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/style-rules`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "name": "Quy tắc kết hợp màu sắc",
     "description": "Các màu sắc tương phản nhẹ sẽ tạo sự hài hòa cho trang phục",
     "ruleType": "color_combination",
     "conditions": [
       {
         "attribute": "color_contrast",
         "operator": "less_than",
         "value": 70
       },
       {
         "attribute": "color_count",
         "operator": "less_than",
         "value": 4
       }
     ],
     "recommendations": [
       {
         "attribute": "color_combination",
         "value": ["blue", "white", "beige"],
         "explanation": "Kết hợp màu xanh dương, trắng và be tạo cảm giác mát mẻ, hài hòa"
       }
     ],
     "score": 0.8,
     "applicableSeasons": ["spring", "summer", "all"],
     "applicableBodyTypes": ["all"]
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
    pm.expect(jsonData).to.have.property('statusCode', 201);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('_id');
    pm.expect(jsonData.metadata).to.have.property('name');
    pm.expect(jsonData.metadata).to.have.property('ruleType');
    pm.expect(jsonData.metadata).to.have.property('conditions').that.is.an('array');
});

// Lưu styleRuleId để sử dụng cho các request tiếp theo
const jsonData = pm.response.json();
if (jsonData.metadata && jsonData.metadata._id) {
    pm.environment.set("styleRuleId", jsonData.metadata._id);
    console.log("Style Rule ID saved: " + jsonData.metadata._id);
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
    "name": "Quy tắc kết hợp màu sắc",
    "description": "Các màu sắc tương phản nhẹ sẽ tạo sự hài hòa cho trang phục",
    "ruleType": "color_combination",
    "conditions": [
      {
        "attribute": "color_contrast",
        "operator": "less_than",
        "value": 70
      },
      {
        "attribute": "color_count",
        "operator": "less_than",
        "value": 4
      }
    ],
    "recommendations": [
      {
        "attribute": "color_combination",
        "value": ["blue", "white", "beige"],
        "explanation": "Kết hợp màu xanh dương, trắng và be tạo cảm giác mát mẻ, hài hòa"
      }
    ],
    "score": 0.8,
    "applicableSeasons": ["spring", "summer", "all"],
    "applicableBodyTypes": ["all"]
  }
  ```
- **Response Success (201)**:
  ```json
  {
    "statusCode": 201,
    "message": "Tạo quy tắc phong cách thành công",
    "metadata": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Quy tắc kết hợp màu sắc",
      "description": "Các màu sắc tương phản nhẹ sẽ tạo sự hài hòa cho trang phục",
      "ruleType": "color_combination",
      "conditions": [
        {
          "attribute": "color_contrast",
          "operator": "less_than",
          "value": 70
        },
        {
          "attribute": "color_count",
          "operator": "less_than",
          "value": 4
        }
      ],
      "recommendations": [
        {
          "attribute": "color_combination",
          "value": ["blue", "white", "beige"],
          "explanation": "Kết hợp màu xanh dương, trắng và be tạo cảm giác mát mẻ, hài hòa"
        }
      ],
      "score": 0.8,
      "isActive": true,
      "isSystem": false,
      "createdBy": "61a1b2c3d4e5f6a7b8c9d0e1",
      "applicableSeasons": ["spring", "summer", "all"],
      "applicableBodyTypes": ["all"],
      "createdAt": "2023-12-15T08:30:00.000Z",
      "updatedAt": "2023-12-15T08:30:00.000Z"
    }
  }
  ```

### 3.2. Lấy Danh Sách Style Rules
- **Endpoint**: `GET /style-rules`
- **Mô tả**: Lấy danh sách các quy tắc phong cách

#### Setup
1. Trong folder "StyleRules", tạo request mới
2. Đặt tên: "Get All Style Rules"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/style-rules`
5. Tab Params: Thêm các tham số sau:
   - `page`: 1
   - `limit`: 10
   - `type`: color_combination (tuỳ chọn)
6. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   ```

#### Test Script
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    pm.expect(jsonData.metadata).to.have.property('rules').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('pagination');
});

// Kiểm tra thông tin phân trang
pm.test("Pagination info is valid", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData.metadata.pagination).to.have.property('total');
    pm.expect(jsonData.metadata.pagination).to.have.property('currentPage');
    pm.expect(jsonData.metadata.pagination).to.have.property('limit');
});
```

### 3.3. Lấy Chi Tiết Style Rule
- **Endpoint**: `GET /style-rules/:id`
- **Mô tả**: Lấy thông tin chi tiết của một quy tắc phong cách

#### Setup
1. Trong folder "StyleRules", tạo request mới
2. Đặt tên: "Get Style Rule Detail"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/style-rules/{{styleRuleId}}`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   ```

#### Test Script
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
    pm.expect(jsonData.metadata).to.have.property('name');
    pm.expect(jsonData.metadata).to.have.property('ruleType');
    pm.expect(jsonData.metadata).to.have.property('conditions').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('recommendations').that.is.an('array');
});
```

### 3.4. Cập Nhật Style Rule
- **Endpoint**: `PUT /style-rules/:id`
- **Mô tả**: Cập nhật thông tin của một quy tắc phong cách

#### Setup
1. Trong folder "StyleRules", tạo request mới
2. Đặt tên: "Update Style Rule"
3. Chọn phương thức: PUT
4. URL: `{{baseUrl}}/style-rules/{{styleRuleId}}`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "name": "Quy tắc kết hợp màu sắc - Cập nhật",
     "description": "Quy tắc về sự hài hòa trong kết hợp màu sắc cho trang phục",
     "recommendations": [
       {
         "attribute": "color_combination",
         "value": ["navy", "white", "beige"],
         "explanation": "Kết hợp màu xanh navy, trắng và be tạo cảm giác thanh lịch và hài hòa"
       }
     ],
     "score": 0.9,
     "applicableSeasons": ["spring", "summer", "fall", "all"]
   }
   ```

#### Test Script
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    
    // Kiểm tra dữ liệu style rule đã được cập nhật
    const styleRule = jsonData.metadata;
    const requestBody = JSON.parse(pm.request.body.raw);
    
    if (requestBody.name) {
        pm.expect(styleRule).to.have.property('name', requestBody.name);
    }
    
    if (requestBody.description) {
        pm.expect(styleRule).to.have.property('description', requestBody.description);
    }
    
    if (requestBody.score) {
        pm.expect(styleRule).to.have.property('score', requestBody.score);
    }
});
```

### 3.5. Xóa Style Rule
- **Endpoint**: `DELETE /style-rules/:id`
- **Mô tả**: Xóa một quy tắc phong cách

#### Setup
1. Trong folder "StyleRules", tạo request mới
2. Đặt tên: "Delete Style Rule"
3. Chọn phương thức: DELETE
4. URL: `{{baseUrl}}/style-rules/{{styleRuleId}}`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   ```

#### Test Script
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
});

// Xác nhận việc xóa bằng cách gọi API lấy chi tiết và kiểm tra lỗi 404
const getDeletedRuleRequest = {
    url: pm.environment.get("baseUrl") + "/style-rules/" + pm.environment.get("styleRuleId"),
    method: 'GET',
    header: {
        'Authorization': 'Bearer ' + pm.environment.get("token")
    }
};

pm.sendRequest(getDeletedRuleRequest, function (err, res) {
    pm.test("Style Rule should be deleted (404 response)", function () {
        pm.expect(res).to.have.property('code', 404);
    });
});
```

### 3.6. Đánh Giá Outfit theo Style Rules
- **Endpoint**: `POST /style-rules/validate-outfit`
- **Mô tả**: Đánh giá một outfit dựa trên các quy tắc phong cách

#### Setup
1. Trong folder "StyleRules", tạo request mới
2. Đặt tên: "Evaluate Outfit"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/style-rules/validate-outfit`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "outfitId": "{{outfitId}}",
     "ruleTypes": ["color_combination", "pattern_matching", "season"]
   }
   ```

#### Test Script
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    
    // Kiểm tra dữ liệu đánh giá
    pm.expect(jsonData.metadata).to.have.property('evaluations').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('overallScore');
    pm.expect(jsonData.metadata).to.have.property('outfit');
    
    // Kiểm tra chi tiết đánh giá nếu có kết quả
    if (jsonData.metadata.evaluations.length > 0) {
        const firstEvaluation = jsonData.metadata.evaluations[0];
        pm.expect(firstEvaluation).to.have.property('ruleId');
        pm.expect(firstEvaluation).to.have.property('ruleName');
        pm.expect(firstEvaluation).to.have.property('ruleType');
        pm.expect(firstEvaluation).to.have.property('score');
    }
});
```

### 3.7. Lấy Metadata của Style Rules
- **Endpoint**: `GET /style-rules/metadata`
- **Mô tả**: Lấy thông tin metadata cho các quy tắc phong cách

#### Setup
1. Trong folder "StyleRules", tạo request mới
2. Đặt tên: "Get Style Rule Metadata"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/style-rules/metadata`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   ```

#### Test Script
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has correct structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('statusCode', 200);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('metadata');
    
    // Kiểm tra metadata
    pm.expect(jsonData.metadata).to.have.property('ruleTypes').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('bodyTypes').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('seasons').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('attributeTypes').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('operatorTypes').that.is.an('array');
});
```

## 4. Chạy Toàn Bộ Collection

Để kiểm thử toàn bộ API Style Rule, bạn nên chạy các requests theo thứ tự sau để đảm bảo tính liên tục của dữ liệu:

1. Đăng nhập để lấy token (từ Authentication collection)
2. Tạo Outfit mới (từ Outfits collection)
3. Tạo Style Rule mới
4. Lấy danh sách Style Rules
5. Lấy chi tiết Style Rule
6. Lấy metadata Style Rules
7. Đánh giá Outfit theo Style Rules
8. Cập nhật Style Rule
9. Xóa Style Rule

Bạn có thể tạo một "Collection Runner" để tự động chạy tuần tự các API trên.

## 5. Xử Lý Lỗi Phổ Biến

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|------------|------------|
| 400 | Dữ liệu không hợp lệ | Kiểm tra định dạng và giá trị của các trường trong request body |
| 401 | Không xác thực | Kiểm tra token xác thực |
| 403 | Không có quyền | Kiểm tra quyền của người dùng |
| 404 | Không tìm thấy style rule | Kiểm tra styleRuleId có tồn tại hay không |
| 500 | Lỗi server | Báo cáo cho đội phát triển |

## 6. Lưu ý Khi Test

1. Luôn lấy token mới trước khi bắt đầu test
2. Đảm bảo có ít nhất một outfit để test API đánh giá outfit
3. Tạo style rule mới cho mỗi lần chạy test để tránh xung đột dữ liệu
4. Kiểm tra kỹ các ràng buộc (validation) của API
5. Xóa style rule sau khi test để tránh rác dữ liệu 