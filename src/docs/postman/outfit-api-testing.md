# Hướng Dẫn Kiểm Thử Outfit API

## 1. Giới Thiệu

Tài liệu này cung cấp hướng dẫn chi tiết về cách kiểm thử tất cả các Outfit API endpoints của hệ thống PSN-BE, bao gồm tạo mới, xem, cập nhật, xóa trang phục và các chức năng liên quan đến quản lý outfit.

## 2. Cài Đặt & Chuẩn Bị

### 2.1. Biến Môi Trường Đặc Biệt cho Outfit API

Ngoài các biến môi trường chung được mô tả trong [Tổng quan](./api-testing-overview.md), API outfit cần các biến sau:

| Biến | Mô tả |
|------|-------|
| `outfitId` | ID của outfit test (tự động lưu sau khi tạo outfit) |
| `itemId` | ID của một item để thêm vào outfit (cần tạo item trước) |
| `token` | Access token cho xác thực (lấy từ API login) |

### 2.2. Collection Setup

Để chuẩn bị cho việc test API Outfit, hãy tạo một thư mục "Outfits" trong collection của bạn và thêm tất cả các API endpoint vào đó:

1. Nhấp chuột phải vào collection và chọn "Add Folder"
2. Đặt tên folder là "Outfits"
3. Thêm từng request vào folder này theo hướng dẫn bên dưới

## 3. Danh Sách API Endpoints

### 3.1. Tạo Mới Outfit
- **Endpoint**: `POST /outfits`
- **Mô tả**: Tạo một trang phục mới

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Create Outfit"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/outfits`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "name": "Outfit mùa hè",
     "description": "Trang phục cho ngày nắng nóng",
     "season": "summer",
     "occasion": "casual",
     "tags": ["summer", "casual", "vacation"],
     "styleTypes": ["casual", "comfortable"],
     "weather": ["sunny", "hot"]
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
    pm.expect(jsonData.metadata).to.have.property('description');
    pm.expect(jsonData.metadata).to.have.property('season');
});

// Lưu outfitId để sử dụng cho các request tiếp theo
const jsonData = pm.response.json();
if (jsonData.metadata && jsonData.metadata._id) {
    pm.environment.set("outfitId", jsonData.metadata._id);
    console.log("Outfit ID saved: " + jsonData.metadata._id);
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
    "name": "Outfit mùa hè",
    "description": "Trang phục cho ngày nắng nóng",
    "season": "summer",
    "occasion": "casual",
    "tags": ["summer", "casual", "vacation"],
    "styleTypes": ["casual", "comfortable"],
    "weather": ["sunny", "hot"]
  }
  ```
- **Response Success (201)**:
  ```json
  {
    "statusCode": 201,
    "message": "Tạo trang phục thành công",
    "metadata": {
      "_id": "65a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Outfit mùa hè",
      "description": "Trang phục cho ngày nắng nóng",
      "ownerId": "61a1b2c3d4e5f6a7b8c9d0e1",
      "season": "summer",
      "occasion": "casual",
      "tags": ["summer", "casual", "vacation"],
      "styleTypes": ["casual", "comfortable"],
      "weather": ["sunny", "hot"],
      "items": [],
      "inCloset": true,
      "wearCount": 0,
      "lastWorn": null,
      "createdAt": "2023-12-15T08:30:00.000Z",
      "updatedAt": "2023-12-15T08:30:00.000Z"
    }
  }
  ```

### 3.2. Lấy Danh Sách Outfit
- **Endpoint**: `GET /outfits`
- **Mô tả**: Lấy danh sách trang phục của người dùng

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Get All Outfits"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/outfits`
5. Tab Params: Thêm các tham số sau:
   - `page`: 1
   - `limit`: 10
   - `season`: summer (tuỳ chọn)
   - `occasion`: casual (tuỳ chọn)
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
    pm.expect(jsonData.metadata).to.have.property('outfits').that.is.an('array');
    pm.expect(jsonData.metadata).to.have.property('pagination');
});

// Kiểm tra thông tin phân trang
pm.test("Pagination info is valid", function() {
    const jsonData = pm.response.json();
    pm.expect(jsonData.metadata.pagination).to.have.property('total');
    pm.expect(jsonData.metadata.pagination).to.have.property('currentPage');
    pm.expect(jsonData.metadata.pagination).to.have.property('limit');
});

// Kiểm tra response headers chứa thông tin phân trang
pm.test("Response headers contain pagination info", function() {
    pm.expect(pm.response.headers.get('X-Total-Count')).to.not.be.undefined;
    pm.expect(pm.response.headers.get('X-Total-Pages')).to.not.be.undefined;
    pm.expect(pm.response.headers.get('X-Current-Page')).to.not.be.undefined;
});
```

### 3.3. Lấy Chi Tiết Outfit
- **Endpoint**: `GET /outfits/:id`
- **Mô tả**: Lấy thông tin chi tiết của một trang phục

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Get Outfit Detail"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/outfits/{{outfitId}}`
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
    pm.expect(jsonData.metadata).to.have.property('season');
    pm.expect(jsonData.metadata).to.have.property('items').that.is.an('array');
});
```

### 3.4. Cập Nhật Outfit
- **Endpoint**: `PUT /outfits/:id`
- **Mô tả**: Cập nhật thông tin của một trang phục

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Update Outfit"
3. Chọn phương thức: PUT
4. URL: `{{baseUrl}}/outfits/{{outfitId}}`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "name": "Outfit mùa hè cập nhật",
     "description": "Trang phục cho ngày nắng nóng và đi biển",
     "season": "summer",
     "occasion": "beach",
     "tags": ["summer", "beach", "vacation", "swimming"],
     "styleTypes": ["casual", "beachwear"]
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
    
    // Kiểm tra dữ liệu outfit đã được cập nhật
    const outfit = jsonData.metadata;
    const requestBody = JSON.parse(pm.request.body.raw);
    
    if (requestBody.name) {
        pm.expect(outfit).to.have.property('name', requestBody.name);
    }
    
    if (requestBody.description) {
        pm.expect(outfit).to.have.property('description', requestBody.description);
    }
    
    if (requestBody.occasion) {
        pm.expect(outfit).to.have.property('occasion', requestBody.occasion);
    }
});
```

### 3.5. Xóa Outfit
- **Endpoint**: `DELETE /outfits/:id`
- **Mô tả**: Xóa một trang phục

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Delete Outfit"
3. Chọn phương thức: DELETE
4. URL: `{{baseUrl}}/outfits/{{outfitId}}`
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
    pm.expect(jsonData.metadata).to.have.property('success', true);
});

// Xác nhận việc xóa bằng cách gọi API lấy chi tiết và kiểm tra lỗi 404
const getDeletedOutfitRequest = {
    url: pm.environment.get("baseUrl") + "/outfits/" + pm.environment.get("outfitId"),
    method: 'GET',
    header: {
        'Authorization': 'Bearer ' + pm.environment.get("token")
    }
};

pm.sendRequest(getDeletedOutfitRequest, function (err, res) {
    pm.test("Outfit should be deleted (404 response)", function () {
        pm.expect(res).to.have.property('code', 404);
    });
});
```

### 3.6. Đánh Dấu Outfit Đã Mặc
- **Endpoint**: `POST /outfits/:id/worn`
- **Mô tả**: Đánh dấu một outfit đã được mặc

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Mark Outfit as Worn"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/outfits/{{outfitId}}/worn`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "wornDate": "2023-12-15T10:00:00Z",
     "occasion": "beach trip",
     "weather": "sunny",
     "location": "Đà Nẵng",
     "rating": 4,
     "notes": "Rất phù hợp cho chuyến đi biển"
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
    
    // Kiểm tra dữ liệu outfit đã được cập nhật
    pm.expect(jsonData.metadata).to.have.property('wearCount').that.is.at.least(1);
    pm.expect(jsonData.metadata).to.have.property('lastWorn');
    pm.expect(jsonData.metadata).to.have.property('wearHistory').that.is.an('array');
});
```

### 3.7. Thêm Item vào Outfit
- **Endpoint**: `POST /outfits/:id/items/:itemId`
- **Mô tả**: Thêm một item vào outfit

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Add Item to Outfit"
3. Chọn phương thức: POST
4. URL: `{{baseUrl}}/outfits/{{outfitId}}/items/{{itemId}}`
5. Tab Headers: Thêm header 
   ```
   Authorization: Bearer {{token}}
   Content-Type: application/json
   ```
6. Tab Body: Chọn "raw" và "JSON", nhập:
   ```json
   {
     "position": "top",
     "layerOrder": 1,
     "notes": "Áo thun trắng",
     "coordinates": {
       "x": 100,
       "y": 50,
       "scale": 1,
       "rotation": 0
     }
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
    
    // Kiểm tra item đã được thêm vào
    const items = jsonData.metadata.items;
    pm.expect(items).to.be.an('array').that.is.not.empty;
    
    // Tìm item vừa thêm vào
    const addedItem = items.find(item => item.itemId._id === pm.environment.get("itemId") || 
                                         item.itemId === pm.environment.get("itemId"));
    pm.expect(addedItem).to.not.be.undefined;
});
```

### 3.8. Xóa Item khỏi Outfit
- **Endpoint**: `DELETE /outfits/:id/items/:itemId`
- **Mô tả**: Xóa một item khỏi outfit

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Remove Item from Outfit"
3. Chọn phương thức: DELETE
4. URL: `{{baseUrl}}/outfits/{{outfitId}}/items/{{itemId}}`
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
    
    // Kiểm tra item đã được xóa
    const items = jsonData.metadata.items;
    
    // Tìm item đã xóa
    const removedItem = items.find(item => item.itemId._id === pm.environment.get("itemId") || 
                                          item.itemId === pm.environment.get("itemId"));
    pm.expect(removedItem).to.be.undefined;
});
```

### 3.9. Lấy Outfit Theo Thời Tiết
- **Endpoint**: `GET /outfits/weather`
- **Mô tả**: Lấy các outfit phù hợp với điều kiện thời tiết

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Get Outfits for Weather"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/outfits/weather`
5. Tab Params: Thêm các tham số sau:
   - `temperature`: 30
   - `weatherCondition`: sunny
   - `limit`: 5
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
    pm.expect(jsonData.metadata).to.be.an('array');
    
    // Kiểm tra nếu có outfit được trả về
    if (jsonData.metadata.length > 0) {
        // Kiểm tra thuộc tính của outfit đầu tiên
        const firstOutfit = jsonData.metadata[0];
        pm.expect(firstOutfit).to.have.property('_id');
        pm.expect(firstOutfit).to.have.property('name');
        pm.expect(firstOutfit).to.have.property('season');
        pm.expect(firstOutfit).to.have.property('weather');
    }
});
```

### 3.10. Lấy Thống Kê Outfit
- **Endpoint**: `GET /outfits/statistics`
- **Mô tả**: Lấy thống kê về các outfit

#### Setup
1. Trong folder "Outfits", tạo request mới
2. Đặt tên: "Get Outfit Statistics"
3. Chọn phương thức: GET
4. URL: `{{baseUrl}}/outfits/statistics`
5. Tab Params: Thêm các tham số sau:
   - `period`: month (có thể là week, month, year, all)
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
    
    // Kiểm tra các thông tin thống kê
    const stats = jsonData.metadata;
    pm.expect(stats).to.have.property('totalOutfits');
    pm.expect(stats).to.have.property('totalWears');
    pm.expect(stats).to.have.property('favoriteOutfits');
    pm.expect(stats).to.have.property('seasonBreakdown');
    pm.expect(stats).to.have.property('occasionBreakdown');
    pm.expect(stats).to.have.property('recentlyWorn');
});
```

## 4. Chạy Toàn Bộ Collection

Để kiểm thử toàn bộ API Outfit, bạn nên chạy các requests theo thứ tự sau để đảm bảo tính liên tục của dữ liệu:

1. Đăng nhập để lấy token (từ Authentication collection)
2. Tạo Outfit mới
3. Lấy danh sách Outfit
4. Lấy chi tiết Outfit
5. Cập nhật Outfit
6. Thêm Item vào Outfit
7. Đánh dấu Outfit đã mặc
8. Lấy thống kê Outfit
9. Lấy Outfit theo thời tiết
10. Xóa Item khỏi Outfit
11. Xóa Outfit

Bạn có thể tạo một "Collection Runner" để tự động chạy tuần tự các API trên.

## 5. Xử Lý Lỗi Phổ Biến

| Mã lỗi | Nguyên nhân | Cách xử lý |
|--------|------------|------------|
| 400 | Dữ liệu không hợp lệ | Kiểm tra định dạng và giá trị của các trường trong request body |
| 401 | Không xác thực | Kiểm tra token xác thực |
| 403 | Không có quyền | Kiểm tra quyền của người dùng |
| 404 | Không tìm thấy outfit | Kiểm tra outfitId có tồn tại hay không |
| 500 | Lỗi server | Báo cáo cho đội phát triển |

## 6. Lưu ý Khi Test

1. Luôn lấy token mới trước khi bắt đầu test
2. Đảm bảo có ít nhất một item để test các API liên quan đến thêm/xóa item
3. Tạo outfit mới cho mỗi lần chạy test để tránh xung đột dữ liệu
4. Kiểm tra kỹ các ràng buộc (validation) của API
5. Xóa outfit sau khi test để tránh rác dữ liệu 