'use strict';

const { ItemRepository } = require('../db/repositories');
const outfitModel = require('../db/models/outfit.model');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { Types } = require('mongoose');
const FirebaseStorage = require('../helpers/firebase.storage');
const firebaseService = require('./firebase.service');
const cache = require('../utils/cache');

// Cache keys
const CACHE_KEYS = {
  ITEM_CATEGORIES: 'item:categories',
  ITEM_PATTERNS: 'item:patterns',
  ITEM_SEASONS: 'item:seasons',
  ITEM_OCCASIONS: 'item:occasions',
  ITEM_COLORS: 'item:colors',
  ITEM_MATERIALS: 'item:materials'
};

// Cache TTLs (thời gian tồn tại)
const CACHE_TTLS = {
  METADATA: 24 * 60 * 60 * 1000, // 24 giờ
  USER_DATA: 5 * 60 * 1000 // 5 phút
};

class ItemService {
  // Tạo mới item
  static async createItem(itemData) {
   

    const itemRepository = new ItemRepository();
    const {aiMeta,...payload} = itemData;
    payload.embedText = aiMeta?.embedText || '';
    payload.embedding = aiMeta?.embedding || [];
    payload.aiMeta = aiMeta || {};
    const newItem = await itemRepository.create(itemData);
    // todo: generate embedding from text if  provided
    return newItem;
  }

  // Lấy danh sách item của người dùng
  static async findUserItems({ userId, page = 1, limit = 20, filter = {}, sort = 'ctime' }) {
    const itemRepository = new ItemRepository();
    return await itemRepository.findUserItems({ userId, page, limit, filter, sort });
  }

  // Lấy chi tiết item
  static async findItemById(itemId, userId) {
    const itemRepository = new ItemRepository();
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemRepository.findUserItem(itemId, userId);
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    return item;
  }

  // Cập nhật item
  static async updateItem(itemId, userId, updateData) {
    const itemRepository = new ItemRepository();
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemRepository.findUserItem(itemId, userId);
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Xác thực quyền sở hữu
    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenError('Bạn không có quyền cập nhật vật phẩm này');
    }
    
    // Cập nhật thông tin item
    const updatedItem = await itemRepository.updateById(itemId, updateData);
    
    return updatedItem;
  }

  // Xóa item
  static async deleteItem(itemId, userId) {
    const itemRepository = new ItemRepository();
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemRepository.findUserItem(itemId, userId);
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Xác thực quyền sở hữu
    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenError('Bạn không có quyền xóa vật phẩm này');
    }
    
    // Kiểm tra xem item có trong outfit nào không
    const outfitWithItem = await outfitModel.findOne({
      'items.itemId': new Types.ObjectId(itemId)
    });
    
    if (outfitWithItem) {
      // Xóa item khỏi outfit
      await outfitModel.updateMany(
        { 'items.itemId': Types.ObjectId(itemId) },
        { $pull: { items: { itemId: Types.ObjectId(itemId) } } }
      );
    }
    
    // Xóa hình ảnh từ Firebase Storage nếu có
    if (item.imageUrl) {
      try {
        await firebaseService.deleteFile(item.imageUrl);
      } catch (error) {
        console.error('Lỗi khi xóa hình ảnh:', error);
        // Tiếp tục xóa item dù có lỗi khi xóa hình ảnh
      }
    }
    
    // Xóa item
    await itemRepository.deleteById(itemId);
    
    return { success: true, message: 'Vật phẩm đã được xóa' };
  }

  // Cập nhật trạng thái item
  static async updateItemStatus(itemId, userId, statusData) {
    const itemRepository = new ItemRepository();
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemRepository.findUserItem(itemId, userId);
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Cập nhật trạng thái
    const updatedItem = await itemRepository.updateItemStatus(itemId, userId, statusData);
    
    return updatedItem;
  }

  // Xử lý tải lên hình ảnh
  static async uploadItemImage(itemId, userId, file) {
    const itemRepository = new ItemRepository();
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemRepository.findUserItem(itemId, userId);
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Xác thực quyền sở hữu
    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenError('Bạn không có quyền cập nhật vật phẩm này');
    }
    
    try {
      const firebaseStorage = FirebaseStorage.getInstance();
      let imageUrl;
      
      // Nếu item đã có ảnh, cập nhật ảnh mới
      if (item.imageUrl) {
        imageUrl = await firebaseStorage.updateImage(item.imageUrl, file);
      } else {
        imageUrl = await firebaseStorage.uploadImage(file);
      }
      
      if (!imageUrl) {
        throw new Error('Lỗi khi tải lên hình ảnh');
      }
      
      // Cập nhật URL hình ảnh trong item
      const updatedItem = await itemRepository.updateById(itemId, { imageUrl });
      
      return updatedItem;
    } catch (error) {
      console.error('Lỗi xử lý hình ảnh:', error);
      throw new BadRequestError('Không thể xử lý hình ảnh: ' + error.message);
    }
  }

  // Xử lý tải lên nhiều hình ảnh
  static async uploadMultipleImages(itemId, userId, files) {
    const itemRepository = new ItemRepository();
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemRepository.findUserItem(itemId, userId);
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Xác thực quyền sở hữu
    if (item.ownerId.toString() !== userId) {
      throw new ForbiddenError('Bạn không có quyền cập nhật vật phẩm này');
    }
    
    try {
      const firebaseStorage = FirebaseStorage.getInstance();
      
      // Tải lên nhiều hình ảnh
      const imageUrls = await firebaseStorage.uploadImages(files);
      
      if (!imageUrls || imageUrls.length === 0) {
        throw new Error('Lỗi khi tải lên hình ảnh');
      }
      
      // Cập nhật URL hình ảnh trong item (giả sử model đã hỗ trợ nhiều ảnh)
      const updatedItem = await itemRepository.updateById(itemId, { images: imageUrls });
      
      return updatedItem;
    } catch (error) {
      console.error('Lỗi xử lý hình ảnh:', error);
      throw new BadRequestError('Không thể xử lý hình ảnh: ' + error.message);
    }
  }

  // Phân tích dữ liệu tủ đồ
  static async getWardrobeAnalytics(userId) {
    try {
      const itemRepository = new ItemRepository();
      // Lấy tất cả items của người dùng
      const { data: items } = await itemRepository.findUserItems({ 
        userId, 
        limit: 1000, // Lấy một số lượng lớn để phân tích
        filter: {} 
      });
      
      // Phân tích theo danh mục
      const categoryAnalytics = await itemRepository.getItemsByCategory(userId);
      
      // Phân tích theo mùa
      const seasonAnalytics = await itemRepository.getItemsBySeason(userId);
      
      // Tính toán các item được sử dụng nhiều nhất
      const mostUsedItems = await itemRepository.getMostUsedItems(userId, 10);
      
      // Tính toán các item ít được sử dụng nhất
      const leastUsedItems = await itemRepository.getLeastUsedItems(userId, 10);
      
      // Phân tích theo màu sắc
      const colorAnalytics = await itemRepository.getItemsByColor(userId);
      
      return {
        totalItems: items.length,
        categoryDistribution: categoryAnalytics,
        seasonDistribution: seasonAnalytics,
        colorDistribution: colorAnalytics,
        mostUsedItems,
        leastUsedItems
      };
    } catch (error) {
      console.error('Lỗi khi phân tích dữ liệu tủ đồ:', error);
      throw new BadRequestError('Không thể phân tích dữ liệu tủ đồ: ' + error.message);
    }
  }

  // Tạo nhiều items cùng lúc (bulk upload)
  static async bulkCreateItems(userId, itemsData) {
    try {
      const itemRepository = new ItemRepository();
      if (!Array.isArray(itemsData) || itemsData.length === 0) {
        throw new BadRequestError('Dữ liệu không hợp lệ');
      }
      
      // Thêm ownerId vào mỗi item
      const enrichedItemsData = itemsData.map(item => ({
        ...item,
        ownerId: userId
      }));
      
      // Tạo nhiều items cùng lúc
      const newItems = await itemRepository.bulkCreate(enrichedItemsData);
      
      return newItems;
    } catch (error) {
      console.error('Lỗi khi tạo nhiều items:', error);
      throw new BadRequestError('Không thể tạo nhiều items: ' + error.message);
    }
  }

  // Import items từ nguồn khác
  static async importItemsFromExternal(userId, source, data) {
    try {
      // Xử lý dữ liệu tùy theo nguồn
      let processedData;
      
      switch (source) {
        case 'csv':
          processedData = this._processCSVData(data, userId);
          break;
        case 'json':
          processedData = this._processJSONData(data, userId);
          break;
        default:
          throw new BadRequestError('Nguồn dữ liệu không được hỗ trợ');
      }
      
      // Tạo nhiều items từ dữ liệu đã xử lý
      const newItems = await this.bulkCreateItems(userId, processedData);
      
      return newItems;
    } catch (error) {
      console.error('Lỗi khi import items:', error);
      throw new BadRequestError('Không thể import items: ' + error.message);
    }
  }
  
  // Xử lý dữ liệu CSV
  static _processCSVData(csvData, userId) {
    // Logic xử lý dữ liệu CSV
    // Giả định csvData đã được parse thành mảng các object
    
    return csvData.map(item => ({
      ...item,
      ownerId: userId
    }));
  }
  
  // Xử lý dữ liệu JSON
  static _processJSONData(jsonData, userId) {
    // Logic xử lý dữ liệu JSON
    
    return jsonData.map(item => ({
      ...item,
      ownerId: userId
    }));
  }

  // Lấy danh sách categories cho item (đã được cache)
  static async getItemCategories() {
    return cache.getOrSet(
      CACHE_KEYS.ITEM_CATEGORIES,
      async () => [
        'top', 'bottom', 'outerwear', 'dress', 'footwear', 'accessory', 'other'
      ],
      CACHE_TTLS.METADATA
    );
  }
  
  // Lấy danh sách patterns cho item (đã được cache)
  static async getItemPatterns() {
    return cache.getOrSet(
      CACHE_KEYS.ITEM_PATTERNS,
      async () => [
        'solid', 'striped', 'plaid', 'floral', 'polka-dot', 'checkered', 'geometric', 'animal-print', 'abstract', 'other'
      ],
      CACHE_TTLS.METADATA
    );
  }
  
  // Lấy danh sách seasons cho item (đã được cache)
  static async getItemSeasons() {
    return cache.getOrSet(
      CACHE_KEYS.ITEM_SEASONS,
      async () => [
        'spring', 'summer', 'fall', 'winter', 'all'
      ],
      CACHE_TTLS.METADATA
    );
  }
  
  // Lấy danh sách occasions cho item (đã được cache)
  static async getItemOccasions() {
    return cache.getOrSet(
      CACHE_KEYS.ITEM_OCCASIONS,
      async () => [
        'casual', 'formal', 'business', 'party', 'sport', 'beach', 'travel', 'home', 'other'
      ],
      CACHE_TTLS.METADATA
    );
  }

  // Lấy danh sách colors phổ biến (đã được cache)
  static async getItemColors() {
    return cache.getOrSet(
      CACHE_KEYS.ITEM_COLORS,
      async () => [
        'black', 'white', 'red', 'blue', 'green', 'yellow', 'brown', 'gray', 'purple', 'pink', 'orange', 'beige', 'navy', 'teal', 'multi'
      ],
      CACHE_TTLS.METADATA
    );
  }
  
  // Lấy danh sách materials phổ biến (đã được cache)
  static async getItemMaterials() {
    return cache.getOrSet(
      CACHE_KEYS.ITEM_MATERIALS,
      async () => [
        'cotton', 'wool', 'polyester', 'silk', 'linen', 'leather', 'denim', 'corduroy', 'cashmere', 'nylon', 'spandex', 'other'
      ],
      CACHE_TTLS.METADATA
    );
  }

  // Lấy tất cả metadata cho items (tất cả trong một lần gọi)
  static async getAllItemMetadata() {
    const [categories, patterns, seasons, occasions, colors, materials] = await Promise.all([
      this.getItemCategories(),
      this.getItemPatterns(),
      this.getItemSeasons(),
      this.getItemOccasions(),
      this.getItemColors(),
      this.getItemMaterials()
    ]);
    
    return {
      categories,
      patterns,
      seasons,
      occasions,
      colors,
      materials
    };
  }
  
  // Xóa cache cho tất cả metadata
  static clearMetadataCache() {
    Object.values(CACHE_KEYS).forEach(key => cache.del(key));
  }
}

module.exports = ItemService; 
