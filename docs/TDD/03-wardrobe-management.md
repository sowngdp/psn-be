# TDD: Giai đoạn 2 - Quản lý tủ đồ cơ bản

## 1. Tổng quan

### 1.1 Mục đích
Tài liệu này mô tả thiết kế kỹ thuật chi tiết cho giai đoạn 2 của dự án PSN-BE: Quản lý tủ đồ cơ bản. Giai đoạn này tập trung vào việc xây dựng các chức năng CRUD cho vật phẩm, upload và xử lý hình ảnh, và phân loại vật phẩm.

### 1.2 Phạm vi
- Xây dựng model, service và API endpoints cho quản lý vật phẩm (items)
- Triển khai hệ thống upload và xử lý hình ảnh (loại bỏ nền)
- Xây dựng hệ thống phân loại vật phẩm theo nhiều tiêu chí

### 1.3 Thời gian dự kiến
3 tuần

## 2. Thiết kế kỹ thuật

### 2.1 Item Model

#### 2.1.1 Schema
```javascript
const itemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    trim: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'other'] 
  },
  subCategory: { 
    type: String, 
    required: false 
  },
  color: { 
    type: String, 
    required: true 
  },
  secondaryColor: { 
    type: String 
  },
  pattern: { 
    type: String,
    enum: ['solid', 'striped', 'plaid', 'floral', 'polka-dot', 'other'] 
  },
  material: { 
    type: String 
  },
  brand: { 
    type: String 
  },
  size: { 
    type: String 
  },
  season: [{ 
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter', 'all'] 
  }],
  occasions: [{ 
    type: String,
    enum: ['casual', 'formal', 'business', 'party', 'sport', 'other'] 
  }],
  imageUrl: { 
    type: String, 
    required: true 
  },
  thumbnailUrl: { 
    type: String 
  },
  imagePublicId: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  usageCount: { 
    type: Number, 
    default: 0 
  },
  lastWorn: { 
    type: Date 
  },
  tags: [{ 
    type: String 
  }],
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  }
}, {
  timestamps: true,
  collection: 'items'
});
```

#### 2.1.2 Indexes
```javascript
itemSchema.index({ user: 1 });
itemSchema.index({ category: 1 });
itemSchema.index({ color: 1 });
itemSchema.index({ tags: 1 });
itemSchema.index({ season: 1 });
itemSchema.index({ occasions: 1 });
```

### 2.2 Xử lý hình ảnh

#### 2.2.1 Firebase Storage Service
```javascript
// services/firebase.service.js
const firebase = require('firebase/app');
require('firebase/storage');
const logger = require('../utils/logger');

// Configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

module.exports = firebase;
```

#### 2.2.2 Storage Service
```javascript
// services/storage.service.js
const firebase = require('./firebase.service');
const { v4: uuidv4 } = require('uuid');
const { BadRequestError } = require('../core/error.response');
const logger = require('../utils/logger');

class StorageService {
  static uploadImageToFirebase = async (imageBuffer, fileName, folderPath = 'items') => {
    try {
      const storage = firebase.storage();
      const storageRef = storage.ref();
      
      // Generate unique filename
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const fileRef = storageRef.child(`${folderPath}/${uniqueFileName}`);
      
      // Upload image
      await fileRef.put(imageBuffer);
      
      // Get public URL
      const fileUrl = await fileRef.getDownloadURL();
      
      return {
        url: fileUrl,
        publicId: `${folderPath}/${uniqueFileName}`
      };
    } catch (error) {
      logger.error(`Error uploading image to Firebase: ${error.message}`);
      throw new BadRequestError('Failed to upload image');
    }
  }
  
  static deleteImageFromFirebase = async (publicId) => {
    try {
      const storage = firebase.storage();
      const storageRef = storage.ref();
      const fileRef = storageRef.child(publicId);
      
      await fileRef.delete();
      
      return true;
    } catch (error) {
      logger.error(`Error deleting image from Firebase: ${error.message}`);
      throw new BadRequestError('Failed to delete image');
    }
  }
}

module.exports = StorageService;
```

#### 2.2.3 Background Removal Service
```javascript
// services/background-removal.service.js
const { removeBackgroundFromImageBase64 } = require('@imgly/background-removal');
const sharp = require('sharp');
const { BadRequestError } = require('../core/error.response');
const logger = require('../utils/logger');

class BackgroundRemovalService {
  static async removeBackground(imageBuffer) {
    try {
      // Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');
      
      // Remove background
      const base64WithoutBackground = await removeBackgroundFromImageBase64(base64Image);
      
      // Convert back to buffer
      const cleanedBuffer = Buffer.from(
        base64WithoutBackground.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
      
      return cleanedBuffer;
    } catch (error) {
      logger.error(`Error removing background: ${error.message}`);
      throw new BadRequestError('Failed to remove background from image');
    }
  }
  
  static async createThumbnail(imageBuffer, width = 300, height = 300) {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(width, height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
        
      return thumbnail;
    } catch (error) {
      logger.error(`Error creating thumbnail: ${error.message}`);
      throw new BadRequestError('Failed to create thumbnail');
    }
  }
}

module.exports = BackgroundRemovalService;
```

### 2.3 Item Service

```javascript
// services/item.service.js
const Item = require('../db/models/item.model');
const StorageService = require('./storage.service');
const BackgroundRemovalService = require('./background-removal.service');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const logger = require('../utils/logger');

class ItemService {
  static async createItem({
    userId,
    name,
    description,
    category,
    subCategory,
    color,
    secondaryColor,
    pattern,
    material,
    brand,
    size,
    season,
    occasions,
    imageBuffer,
    imageName,
    tags
  }) {
    try {
      // Remove background from image
      const processedImage = await BackgroundRemovalService.removeBackground(imageBuffer);
      
      // Create thumbnail
      const thumbnail = await BackgroundRemovalService.createThumbnail(processedImage);
      
      // Upload main image
      const mainImage = await StorageService.uploadImageToFirebase(
        processedImage,
        imageName,
        `items/${userId}`
      );
      
      // Upload thumbnail
      const thumbnailImage = await StorageService.uploadImageToFirebase(
        thumbnail,
        `thumb_${imageName}`,
        `items/${userId}/thumbnails`
      );
      
      // Create item in database
      const newItem = await Item.create({
        user: userId,
        name,
        description,
        category,
        subCategory,
        color,
        secondaryColor,
        pattern,
        material,
        brand,
        size,
        season,
        occasions,
        imageUrl: mainImage.url,
        thumbnailUrl: thumbnailImage.url,
        imagePublicId: mainImage.publicId,
        tags
      });
      
      return newItem;
    } catch (error) {
      logger.error(`Error creating item: ${error.message}`);
      throw new BadRequestError('Failed to create item');
    }
  }
  
  static async getAllItemsByUser(userId, { 
    page = 1, 
    limit = 20,
    category,
    color,
    season,
    occasion,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      const query = { user: userId, isActive: true };
      
      if (category) query.category = category;
      if (color) query.color = color;
      if (season) query.season = { $in: [season] };
      if (occasion) query.occasions = { $in: [occasion] };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      // Create sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // Get items with pagination
      const items = await Item.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
        
      // Get total count for pagination
      const total = await Item.countDocuments(query);
      
      return {
        items,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error getting items: ${error.message}`);
      throw new BadRequestError('Failed to get items');
    }
  }
  
  static async getItemById(itemId, userId) {
    try {
      const item = await Item.findOne({ _id: itemId, user: userId, isActive: true });
      
      if (!item) {
        throw new NotFoundError('Item not found');
      }
      
      return item;
    } catch (error) {
      logger.error(`Error getting item: ${error.message}`);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to get item');
    }
  }
  
  static async updateItem(itemId, userId, updateData) {
    try {
      const item = await Item.findOne({ _id: itemId, user: userId, isActive: true });
      
      if (!item) {
        throw new NotFoundError('Item not found');
      }
      
      // Handle image update if provided
      if (updateData.imageBuffer && updateData.imageName) {
        // Remove background from new image
        const processedImage = await BackgroundRemovalService.removeBackground(updateData.imageBuffer);
        
        // Create thumbnail
        const thumbnail = await BackgroundRemovalService.createThumbnail(processedImage);
        
        // Upload main image
        const mainImage = await StorageService.uploadImageToFirebase(
          processedImage,
          updateData.imageName,
          `items/${userId}`
        );
        
        // Upload thumbnail
        const thumbnailImage = await StorageService.uploadImageToFirebase(
          thumbnail,
          `thumb_${updateData.imageName}`,
          `items/${userId}/thumbnails`
        );
        
        // Delete old images if they exist
        if (item.imagePublicId) {
          await StorageService.deleteImageFromFirebase(item.imagePublicId);
        }
        
        // Update image URLs
        updateData.imageUrl = mainImage.url;
        updateData.thumbnailUrl = thumbnailImage.url;
        updateData.imagePublicId = mainImage.publicId;
        
        // Remove imageBuffer and imageName from updateData
        delete updateData.imageBuffer;
        delete updateData.imageName;
      }
      
      // Update item
      const updatedItem = await Item.findByIdAndUpdate(
        itemId,
        { $set: updateData },
        { new: true }
      );
      
      return updatedItem;
    } catch (error) {
      logger.error(`Error updating item: ${error.message}`);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to update item');
    }
  }
  
  static async deleteItem(itemId, userId) {
    try {
      const item = await Item.findOne({ _id: itemId, user: userId });
      
      if (!item) {
        throw new NotFoundError('Item not found');
      }
      
      // Soft delete - set isActive to false
      const deletedItem = await Item.findByIdAndUpdate(
        itemId,
        { $set: { isActive: false } },
        { new: true }
      );
      
      return deletedItem;
    } catch (error) {
      logger.error(`Error deleting item: ${error.message}`);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to delete item');
    }
  }
  
  static async updateWearingStatus(itemId, userId) {
    try {
      const item = await Item.findOne({ _id: itemId, user: userId, isActive: true });
      
      if (!item) {
        throw new NotFoundError('Item not found');
      }
      
      // Update usage count and last worn date
      const updatedItem = await Item.findByIdAndUpdate(
        itemId,
        { 
          $inc: { usageCount: 1 },
          $set: { lastWorn: new Date() }
        },
        { new: true }
      );
      
      return updatedItem;
    } catch (error) {
      logger.error(`Error updating wearing status: ${error.message}`);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Failed to update wearing status');
    }
  }
  
  static async getItemCategories() {
    return [
      'tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'other'
    ];
  }
  
  static async getItemPatterns() {
    return [
      'solid', 'striped', 'plaid', 'floral', 'polka-dot', 'other'
    ];
  }
  
  static async getItemSeasons() {
    return [
      'spring', 'summer', 'fall', 'winter', 'all'
    ];
  }
  
  static async getItemOccasions() {
    return [
      'casual', 'formal', 'business', 'party', 'sport', 'other'
    ];
  }
}

module.exports = ItemService;
```

### 2.4 API Endpoints

#### 2.4.1 Item Controller
```javascript
// api/controllers/item.controller.js
const ItemService = require('../../services/item.service');
const { CREATED, OK } = require('../../core/success.response');
const asyncHandler = require('../../helpers/asyncHandler');

class ItemController {
  createItem = asyncHandler(async (req, res, next) => {
    const { 
      name, description, category, subCategory, color, secondaryColor,
      pattern, material, brand, size, season, occasions, tags
    } = req.body;
    
    const { file } = req;
    
    if (!file) {
      throw new BadRequestError('Image is required');
    }
    
    const imageBuffer = file.buffer;
    const imageName = file.originalname;
    
    const item = await ItemService.createItem({
      userId: req.user.id,
      name,
      description,
      category,
      subCategory,
      color,
      secondaryColor,
      pattern,
      material,
      brand,
      size,
      season: season ? season.split(',') : [],
      occasions: occasions ? occasions.split(',') : [],
      imageBuffer,
      imageName,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    new CREATED({
      message: 'Item created successfully',
      metadata: { item }
    }).send(res);
  });
  
  getAllItems = asyncHandler(async (req, res, next) => {
    const { 
      page, limit, category, color, season, occasion, search, sortBy, sortOrder
    } = req.query;
    
    const items = await ItemService.getAllItemsByUser(
      req.user.id,
      { page, limit, category, color, season, occasion, search, sortBy, sortOrder }
    );
    
    new OK({
      message: 'Items retrieved successfully',
      metadata: items
    }).send(res);
  });
  
  getItemById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const item = await ItemService.getItemById(id, req.user.id);
    
    new OK({
      message: 'Item retrieved successfully',
      metadata: { item }
    }).send(res);
  });
  
  updateItem = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Handle image if provided
    if (req.file) {
      updateData.imageBuffer = req.file.buffer;
      updateData.imageName = req.file.originalname;
    }
    
    // Handle arrays
    if (updateData.season) {
      updateData.season = updateData.season.split(',');
    }
    
    if (updateData.occasions) {
      updateData.occasions = updateData.occasions.split(',');
    }
    
    if (updateData.tags) {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }
    
    const updatedItem = await ItemService.updateItem(id, req.user.id, updateData);
    
    new OK({
      message: 'Item updated successfully',
      metadata: { item: updatedItem }
    }).send(res);
  });
  
  deleteItem = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    await ItemService.deleteItem(id, req.user.id);
    
    new OK({
      message: 'Item deleted successfully'
    }).send(res);
  });
  
  updateWearingStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    
    const updatedItem = await ItemService.updateWearingStatus(id, req.user.id);
    
    new OK({
      message: 'Wearing status updated successfully',
      metadata: { item: updatedItem }
    }).send(res);
  });
  
  getItemMetadata = asyncHandler(async (req, res, next) => {
    const categories = await ItemService.getItemCategories();
    const patterns = await ItemService.getItemPatterns();
    const seasons = await ItemService.getItemSeasons();
    const occasions = await ItemService.getItemOccasions();
    
    new OK({
      message: 'Item metadata retrieved successfully',
      metadata: { categories, patterns, seasons, occasions }
    }).send(res);
  });
  
  processImageWithBgRemoval = asyncHandler(async (req, res, next) => {
    const { file } = req;
    
    if (!file) {
      throw new BadRequestError('Image is required');
    }
    
    const processedImage = await BackgroundRemovalService.removeBackground(file.buffer);
    
    // Convert buffer to base64 for response
    const base64Image = processedImage.toString('base64');
    
    new OK({
      message: 'Image processed successfully',
      metadata: { 
        image: `data:image/png;base64,${base64Image}`
      }
    }).send(res);
  });
}

module.exports = new ItemController();
```

#### 2.4.2 Item Routes
```javascript
// api/routes/item.route.js
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');
const { authentication } = require('../middleware/authentication');
const { itemValidator } = require('../middleware/validator');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Authentication required for all item routes
router.use(authentication);

// Item routes
router.post('/', upload.single('image'), itemValidator.createItem, itemController.createItem);
router.get('/', itemController.getAllItems);
router.get('/metadata', itemController.getItemMetadata);
router.get('/:id', itemController.getItemById);
router.put('/:id', upload.single('image'), itemValidator.updateItem, itemController.updateItem);
router.delete('/:id', itemController.deleteItem);
router.post('/:id/worn', itemController.updateWearingStatus);

// Image processing route
router.post('/process-image', upload.single('image'), itemController.processImageWithBgRemoval);

module.exports = router;
```

#### 2.4.3 Update index.js routes
```javascript
// api/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.route');
const itemRoutes = require('./item.route');

// Register routes
router.use('/auth', authRoutes);
router.use('/items', itemRoutes);

module.exports = router;
```

#### 2.4.4 Item Validation
```javascript
// api/middleware/validator.js
const { body } = require('express-validator');
const validateRequest = require('../helpers/validateRequest');

exports.itemValidator = {
  createItem: [
    body('name').notEmpty().withMessage('Item name is required'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'other'])
      .withMessage('Invalid category'),
    body('color').notEmpty().withMessage('Color is required'),
    body('pattern')
      .optional()
      .isIn(['solid', 'striped', 'plaid', 'floral', 'polka-dot', 'other'])
      .withMessage('Invalid pattern'),
    body('season.*')
      .optional()
      .isIn(['spring', 'summer', 'fall', 'winter', 'all'])
      .withMessage('Invalid season'),
    body('occasions.*')
      .optional()
      .isIn(['casual', 'formal', 'business', 'party', 'sport', 'other'])
      .withMessage('Invalid occasion'),
    validateRequest
  ],
  
  updateItem: [
    body('name').optional().notEmpty().withMessage('Item name cannot be empty'),
    body('category')
      .optional()
      .isIn(['tops', 'bottoms', 'dresses', 'outerwear', 'footwear', 'accessories', 'other'])
      .withMessage('Invalid category'),
    body('pattern')
      .optional()
      .isIn(['solid', 'striped', 'plaid', 'floral', 'polka-dot', 'other'])
      .withMessage('Invalid pattern'),
    body('season.*')
      .optional()
      .isIn(['spring', 'summer', 'fall', 'winter', 'all'])
      .withMessage('Invalid season'),
    body('occasions.*')
      .optional()
      .isIn(['casual', 'formal', 'business', 'party', 'sport', 'other'])
      .withMessage('Invalid occasion'),
    validateRequest
  ]
};
```

## 3. API Endpoints Summary

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/v1/api/items` | Create new item | Multipart form with image and item details | Created item |
| GET | `/v1/api/items` | Get all items for user | Query params for filtering/sorting | Items with pagination |
| GET | `/v1/api/items/:id` | Get item by ID | - | Item details |
| PUT | `/v1/api/items/:id` | Update item | Multipart form with optional image and updated details | Updated item |
| DELETE | `/v1/api/items/:id` | Delete (soft) item | - | Success message |
| POST | `/v1/api/items/:id/worn` | Update wearing status | - | Updated item |
| GET | `/v1/api/items/metadata` | Get item metadata | - | Categories, patterns, seasons, occasions |
| POST | `/v1/api/items/process-image` | Process image (remove background) | Image file | Processed image (base64) |

## 4. Kế hoạch triển khai

### 4.1 Danh sách công việc
1. Cài đặt thư viện xử lý hình ảnh (@imgly/background-removal, sharp, firebase)
2. Cấu hình Firebase Storage (tạo project, lấy credentials)
3. Xây dựng Item model
4. Triển khai Storage service
5. Triển khai Background Removal service
6. Xây dựng Item service
7. Cấu hình Multer cho upload hình ảnh
8. Triển khai Item controller
9. Thiết lập Item validation
10. Tạo Item routes và tích hợp vào index
11. Viết unit tests
12. Cập nhật API documentation (Swagger)

### 4.2 Dependencies mới
- @imgly/background-removal
- sharp
- firebase/firebase-admin
- multer
- uuid

## 5. Kết luận

Giai đoạn 2 - Quản lý tủ đồ cơ bản là bước quan trọng để xây dựng tính năng cốt lõi của ứng dụng Personal Style Network. Việc xây dựng các chức năng CRUD cho vật phẩm, hệ thống xử lý hình ảnh với khả năng loại bỏ nền, và hệ thống phân loại linh hoạt sẽ tạo nền tảng cho các tính năng phức tạp hơn như quản lý outfit và hệ thống đề xuất trang phục trong các giai đoạn tiếp theo. 