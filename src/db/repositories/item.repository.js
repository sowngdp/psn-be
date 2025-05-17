'use strict';

const BaseRepository = require('./base.repository');
const Item = require('../models/item.model');
const { Types } = require('mongoose');
const cache = require('../../utils/cache');

/**
 * Repository chuyên biệt cho Item model
 * @class ItemRepository
 * @extends BaseRepository
 */
class ItemRepository extends BaseRepository {
  constructor() {
    super(Item);
  }

  /**
   * Các khóa cache liên quan đến repository
   */
  static CACHE_KEYS = {
    POPULAR_ITEMS: 'items:popular:',
    USER_STATS: 'items:stats:user:',
    UNUSED_ITEMS: 'items:unused:user:',
    CATEGORY_COUNTS: 'items:category-counts:user:'
  };

  /**
   * Thời gian tồn tại của cache
   */
  static CACHE_TTL = {
    POPULAR_ITEMS: 12 * 60 * 60 * 1000, // 12 giờ
    USER_STATS: 30 * 60 * 1000, // 30 phút
    CATEGORY_COUNTS: 60 * 60 * 1000 // 1 giờ
  };

  /**
   * Tìm tất cả item của một người dùng với các tùy chọn lọc và sắp xếp
   * @param {Object} options - Các tùy chọn
   * @param {string} options.userId - ID của người dùng sở hữu các items
   * @param {number} options.page - Trang hiện tại
   * @param {number} options.limit - Số items mỗi trang
   * @param {Object} options.filter - Bộ lọc (category, color, season, etc.)
   * @param {string} options.sort - Cách sắp xếp ('ctime', 'name_asc', 'wear_count', etc.)
   * @param {boolean} options.includeMetadata - Có bao gồm metadata hay không
   * @returns {Promise<Object>} Danh sách items và thông tin phân trang
   */
  async findUserItems({ userId, page = 1, limit = 20, filter = {}, sort = 'ctime', includeMetadata = false }) {
    // Thêm ownerId vào filter
    const queryFilter = { ownerId: userId };
    
    // Xử lý các filter nâng cao
    if (filter.category) queryFilter.category = filter.category;
    if (filter.subCategory) queryFilter.subCategory = filter.subCategory;
    if (filter.color) queryFilter.color = filter.color;
    if (filter.season) queryFilter.season = filter.season;
    if (filter.inCloset !== undefined) queryFilter.inCloset = filter.inCloset;
    if (filter.isFavorite !== undefined) queryFilter.isFavorite = filter.isFavorite;
    
    // Xử lý tìm kiếm theo text
    if (filter.search) {
      queryFilter.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { brand: { $regex: filter.search, $options: 'i' } },
        { tags: { $regex: filter.search, $options: 'i' } }
      ];
    }
    
    // Xử lý lọc theo mảng giá trị
    if (filter.categories && filter.categories.length) queryFilter.category = { $in: filter.categories };
    if (filter.seasons && filter.seasons.length) queryFilter.season = { $in: filter.seasons };
    if (filter.occasions && filter.occasions.length) queryFilter.occasion = { $in: filter.occasions };
    if (filter.styles && filter.styles.length) queryFilter.style = { $in: filter.styles };
    if (filter.materials && filter.materials.length) queryFilter.material = { $in: filter.materials };
    
    // Lọc theo ngày mua, ngày tạo, lần cuối sử dụng
    if (filter.purchasedAfter) queryFilter['purchaseInfo.date'] = { $gte: new Date(filter.purchasedAfter) };
    if (filter.purchasedBefore) {
      queryFilter['purchaseInfo.date'] = queryFilter['purchaseInfo.date'] || {};
      queryFilter['purchaseInfo.date'].$lte = new Date(filter.purchasedBefore);
    }
    if (filter.createdAfter) queryFilter.createdAt = { $gte: new Date(filter.createdAfter) };
    if (filter.createdBefore) {
      queryFilter.createdAt = queryFilter.createdAt || {};
      queryFilter.createdAt.$lte = new Date(filter.createdBefore);
    }
    if (filter.lastWornAfter) queryFilter.lastWorn = { $gte: new Date(filter.lastWornAfter) };
    if (filter.lastWornBefore) {
      queryFilter.lastWorn = queryFilter.lastWorn || {};
      queryFilter.lastWorn.$lte = new Date(filter.lastWornBefore);
    }
    
    // Lọc theo số lần mặc
    if (filter.minWearCount !== undefined) queryFilter.wearCount = { $gte: filter.minWearCount };
    if (filter.maxWearCount !== undefined) {
      queryFilter.wearCount = queryFilter.wearCount || {};
      queryFilter.wearCount.$lte = filter.maxWearCount;
    }
    
    // Lọc theo AI tags
    if (filter.aiTags && filter.aiTags.length) {
      queryFilter['meta.aiTags'] = { $in: filter.aiTags };
    }
    
    // Xác định cách sắp xếp
    let sortOptions = {};
    switch (sort) {
      case 'ctime':
        sortOptions = { createdAt: -1 };
        break;
      case 'ctime_asc':
        sortOptions = { createdAt: 1 };
        break;
      case 'utime':
        sortOptions = { updatedAt: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'wear_count':
        sortOptions = { wearCount: -1 };
        break;
      case 'wear_count_asc':
        sortOptions = { wearCount: 1 };
        break;
      case 'last_worn':
        sortOptions = { lastWorn: -1 };
        break;
      case 'last_worn_asc':
        sortOptions = { lastWorn: 1 };
        break;
      case 'price_high':
        sortOptions = { 'purchaseInfo.price': -1 };
        break;
      case 'price_low':
        sortOptions = { 'purchaseInfo.price': 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Xác định fields cần lấy (projection)
    let projection = null;
    if (!includeMetadata) {
      projection = {
        wearHistory: 0,
        'meta.analytics': 0
      };
    }

    return this.findMany({
      filter: queryFilter,
      page,
      limit,
      sort: sortOptions,
      projection
    });
  }

  /**
   * Tìm item thuộc về người dùng cụ thể
   * @param {string} itemId - ID của item
   * @param {string} userId - ID của người dùng
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {Promise<Document|null>} Item nếu tìm thấy, null nếu không
   */
  async findUserItem(itemId, userId, options = {}) {
    const query = {
      _id: itemId,
      ownerId: userId
    };
    
    // Nếu yêu cầu cụ thể về trạng thái inCloset
    if (options.inCloset !== undefined) {
      query.inCloset = options.inCloset;
    }
    
    // Sử dụng projection nếu cần
    const projection = options.projection || null;
    
    return this.model.findOne(query, projection);
  }

  /**
   * Cập nhật trạng thái của item (inCloset, condition, etc.)
   * @param {string} itemId - ID của item
   * @param {string} userId - ID của người dùng
   * @param {Object} statusData - Dữ liệu trạng thái cần cập nhật
   * @returns {Promise<Document|null>} Item đã cập nhật hoặc null nếu không tìm thấy
   */
  async updateItemStatus(itemId, userId, statusData) {
    // Chỉ cho phép cập nhật các trường liên quan đến trạng thái
    const allowedFields = ['inCloset', 'condition', 'isFavorite', 'status'];
    const updateData = {};
    
    Object.keys(statusData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = statusData[key];
      }
    });
    
    // Cập nhật item chỉ khi nó thuộc về người dùng
    return this.model.findOneAndUpdate(
      { _id: itemId, ownerId: userId },
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Tăng số lần sử dụng item và cập nhật thời gian sử dụng gần nhất
   * @param {string} itemId - ID của item
   * @param {Object} wearData - Thông tin bổ sung về lần sử dụng
   * @returns {Promise<Document|null>} Item đã cập nhật hoặc null nếu không tìm thấy
   */
  async incrementWearCount(itemId, wearData = {}) {
    const updateQuery = { 
      $inc: { wearCount: 1 },
      $set: { lastWorn: wearData.date || new Date() }
    };
    
    // Thêm vào lịch sử nếu có dữ liệu
    if (Object.keys(wearData).length > 0) {
      const historyEntry = {
        date: wearData.date || new Date(),
        outfitId: wearData.outfitId,
        weather: wearData.weather,
        notes: wearData.notes
      };
      
      updateQuery.$push = { wearHistory: historyEntry };
      
      // Cập nhật thống kê theo mùa nếu có thông tin mùa
      if (wearData.season && ['spring', 'summer', 'fall', 'winter'].includes(wearData.season)) {
        const seasonKey = `meta.analytics.seasonUsage.${wearData.season}`;
        updateQuery.$inc[seasonKey] = 1;
      }
    }
    
    return this.model.findByIdAndUpdate(
      itemId,
      updateQuery,
      { new: true }
    );
  }

  /**
   * Tìm các items theo nhiều ID với tùy chọn projection
   * @param {string[]} itemIds - Mảng các ID items cần tìm
   * @param {Object} projection - Các trường cần lấy
   * @returns {Promise<Document[]>} Mảng các items tìm thấy
   */
  async findByIds(itemIds, projection = null) {
    const objectIds = itemIds.map(id => Types.ObjectId(id));
    return this.model.find({ _id: { $in: objectIds } }, projection);
  }

  /**
   * Tìm items dựa trên các tiêu chí lọc nâng cao
   * @param {Object} criteria - Tiêu chí lọc
   * @param {Object} options - Tùy chọn bổ sung (sắp xếp, giới hạn, etc.)
   * @returns {Promise<Document[]>} Mảng các items tìm thấy
   */
  async findByCriteria(criteria, options = {}) {
    const query = {};
    
    // Xây dựng query phức tạp dựa trên criteria
    if (criteria.ownerId) query.ownerId = criteria.ownerId;
    if (criteria.categories && criteria.categories.length) query.category = { $in: criteria.categories };
    if (criteria.colors && criteria.colors.length) query.color = { $in: criteria.colors };
    if (criteria.seasons && criteria.seasons.length) query.season = { $in: criteria.seasons };
    if (criteria.occasions && criteria.occasions.length) query.occasion = { $in: criteria.occasions };
    if (criteria.styles && criteria.styles.length) query.style = { $in: criteria.styles };
    if (criteria.tags && criteria.tags.length) query.tags = { $in: criteria.tags };
    if (criteria.inCloset !== undefined) query.inCloset = criteria.inCloset;
    if (criteria.aiTags && criteria.aiTags.length) query['meta.aiTags'] = { $in: criteria.aiTags };
    
    // Thêm điều kiện lọc theo ngày nếu có
    if (criteria.createdAfter) query.createdAt = { $gte: new Date(criteria.createdAfter) };
    if (criteria.createdBefore) {
      query.createdAt = query.createdAt || {};
      query.createdAt.$lte = new Date(criteria.createdBefore);
    }
    
    // Tìm kiếm theo tên/description
    if (criteria.search) {
      query.$or = [
        { name: { $regex: criteria.search, $options: 'i' } },
        { description: { $regex: criteria.search, $options: 'i' } },
        { tags: { $regex: criteria.search, $options: 'i' } }
      ];
    }
    
    // Xử lý các tùy chọn bổ sung
    const { limit = 100, sort = { createdAt: -1 }, page = 1, projection = null } = options;
    const skip = (page - 1) * limit;
    
    // Build query
    let findQuery = this.model.find(query, projection);
    if (sort) findQuery = findQuery.sort(sort);
    if (limit > 0) findQuery = findQuery.limit(limit);
    if (skip > 0) findQuery = findQuery.skip(skip);
    
    return findQuery.exec();
  }

  /**
   * Thực hiện các thao tác bulk (tạo/cập nhật nhiều items)
   * @param {Object[]} operations - Mảng các thao tác bulk
   * @returns {Promise<Object>} Kết quả của bulk operation
   */
  async bulkWrite(operations) {
    return this.model.bulkWrite(operations);
  }

  /**
   * Lấy thống kê về items của người dùng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Object>} Thống kê về items
   */
  async getItemStatistics(userId) {
    const pipeline = [
      { $match: { ownerId: Types.ObjectId(userId) } },
      {
        $facet: {
          // Đếm số lượng theo category
          categoryStats: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          // Đếm số lượng theo màu sắc
          colorStats: [
            { $group: { _id: '$color', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          // Đếm số lượng theo mùa
          seasonStats: [
            { $group: { _id: '$season', count: { $sum: 1 } } }
          ],
          // Số items thêm vào theo tháng
          itemsByMonth: [
            {
              $group: {
                _id: {
                  year: { $year: '$createdAt' },
                  month: { $month: '$createdAt' }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ],
          // Tính tổng số lần mặc
          totalWears: [
            { $group: { _id: null, total: { $sum: '$wearCount' } } }
          ],
          // Thông tin tổng quan
          summary: [
            {
              $group: {
                _id: null,
                totalItems: { $sum: 1 },
                activeItems: { $sum: { $cond: [{ $eq: ['$inCloset', true] }, 1, 0] } },
                favoriteItems: { $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] } },
                unwornItems: { $sum: { $cond: [{ $eq: ['$wearCount', 0] }, 1, 0] } },
                averageWears: { $avg: '$wearCount' }
              }
            }
          ]
        }
      }
    ];
    
    const result = await this.model.aggregate(pipeline);
    return result[0];
  }

  /**
   * Lấy danh sách items được sử dụng nhiều nhất
   * @param {string} userId - ID người dùng
   * @param {number} limit - Số lượng items trả về
   * @returns {Promise<Document[]>} Danh sách items
   */
  async getMostUsedItems(userId, limit = 10) {
    const cacheKey = `${ItemRepository.CACHE_KEYS.POPULAR_ITEMS}${userId}:${limit}`;
    
    return cache.getOrSet(cacheKey, async () => {
      return this.model.find({
        ownerId: userId,
        wearCount: { $gt: 0 }
      })
      .sort({ wearCount: -1 })
      .limit(limit)
      .select('name category color imageUrl wearCount lastWorn');
    }, ItemRepository.CACHE_TTL.POPULAR_ITEMS);
  }

  /**
   * Lấy danh sách items không sử dụng trong khoảng thời gian
   * @param {string} userId - ID người dùng
   * @param {number} days - Số ngày
   * @param {number} limit - Số lượng items trả về
   * @returns {Promise<Document[]>} Danh sách items
   */
  async getUnusedItems(userId, days = 90, limit = 20) {
    const cacheKey = `${ItemRepository.CACHE_KEYS.UNUSED_ITEMS}${userId}:${days}:${limit}`;
    
    return cache.getOrSet(cacheKey, async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return this.model.find({
        ownerId: userId,
        inCloset: true,
        $or: [
          { lastWorn: { $lt: cutoffDate } },
          { lastWorn: { $exists: false } }
        ]
      })
      .sort({ lastWorn: 1, createdAt: 1 })
      .limit(limit)
      .select('name category color imageUrl createdAt lastWorn'); // Chỉ lấy các trường cần thiết
    }, ItemRepository.CACHE_TTL.USER_STATS);
  }

  /**
   * Cập nhật thông tin ảnh của item
   * @param {string} itemId - ID của item
   * @param {Object} imageData - Thông tin ảnh mới
   * @returns {Promise<Document|null>} Item đã cập nhật
   */
  async updateItemImages(itemId, imageData) {
    const updateQuery = {};
    
    // Thêm ảnh mới vào mảng images
    if (imageData.newImage) {
      updateQuery.$push = {
        images: {
          url: imageData.newImage.url,
          isMain: imageData.newImage.isMain || false,
          backgroundRemoved: imageData.newImage.backgroundRemoved || false,
          addedAt: new Date()
        }
      };
      
      // Nếu ảnh mới là ảnh chính, đặt lại các ảnh khác
      if (imageData.newImage.isMain) {
        updateQuery.$set = { 'images.$[].isMain': false };
        // Sử dụng arrayFilters để chỉ cập nhật ảnh mới
        return this.model.findByIdAndUpdate(
          itemId,
          { ...updateQuery, $set: { 'images.$[elem].isMain': false } },
          { 
            new: true,
            arrayFilters: [{ 'elem.url': { $ne: imageData.newImage.url } }]
          }
        );
      }
    }
    
    // Cập nhật ảnh hiện tại
    if (imageData.updateImage) {
      return this.model.findOneAndUpdate(
        { _id: itemId, 'images.url': imageData.updateImage.url },
        { 
          $set: { 
            'images.$.isMain': imageData.updateImage.isMain,
            'images.$.backgroundRemoved': imageData.updateImage.backgroundRemoved 
          } 
        },
        { new: true }
      );
    }
    
    // Xóa ảnh
    if (imageData.removeImageUrl) {
      updateQuery.$pull = {
        images: { url: imageData.removeImageUrl }
      };
    }
    
    // Cập nhật trường imageUrl cũ (cho backward compatibility)
    if (imageData.legacyImageUrl) {
      updateQuery.$set = updateQuery.$set || {};
      updateQuery.$set.imageUrl = imageData.legacyImageUrl;
    }
    
    return this.model.findByIdAndUpdate(itemId, updateQuery, { new: true });
  }

  /**
   * Lấy thống kê số lượng items theo category cho người dùng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Array>} Mảng thống kê theo danh mục
   */
  async getItemsByCategory(userId) {
    const cacheKey = `${ItemRepository.CACHE_KEYS.CATEGORY_COUNTS}${userId}`;
    
    return cache.getOrSet(cacheKey, async () => {
      const result = await this.model.aggregate([
        { $match: { ownerId: Types.ObjectId(userId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      return result;
    }, ItemRepository.CACHE_TTL.CATEGORY_COUNTS);
  }

  /**
   * Tạo các indexes cho collection
   * Gọi hàm này khi khởi động ứng dụng
   */
  async createIndexes() {
    // Index cơ bản
    await this.model.collection.createIndex({ ownerId: 1 });
    await this.model.collection.createIndex({ category: 1 });
    await this.model.collection.createIndex({ inCloset: 1 });
    
    // Compound indexes cho các query phổ biến
    await this.model.collection.createIndex({ ownerId: 1, category: 1 });
    await this.model.collection.createIndex({ ownerId: 1, inCloset: 1 });
    await this.model.collection.createIndex({ ownerId: 1, wearCount: -1 });
    await this.model.collection.createIndex({ ownerId: 1, season: 1 });
    await this.model.collection.createIndex({ ownerId: 1, lastWorn: 1 });
    await this.model.collection.createIndex({ ownerId: 1, createdAt: -1 });
    
    // Text index cho tìm kiếm
    await this.model.collection.createIndex({ 
      name: 'text', 
      description: 'text', 
      tags: 'text',
      'meta.aiTags': 'text'
    });
    
    return true;
  }

  /**
   * Xóa cache liên quan đến items của người dùng
   * @param {string} userId - ID của người dùng
   */
  async clearUserCache(userId) {
    const keysToDelete = [
      `${ItemRepository.CACHE_KEYS.POPULAR_ITEMS}${userId}:*`,
      `${ItemRepository.CACHE_KEYS.USER_STATS}${userId}:*`,
      `${ItemRepository.CACHE_KEYS.UNUSED_ITEMS}${userId}:*`,
      `${ItemRepository.CACHE_KEYS.CATEGORY_COUNTS}${userId}`
    ];
    
    // Xóa các key cache liên quan đến user
    keysToDelete.forEach(pattern => {
      const keysToDelete = Array.from(cache.getKeys()).filter(key => 
        key.startsWith(pattern.replace('*', ''))
      );
      keysToDelete.forEach(key => cache.del(key));
    });
  }

  // Cập nhật các phương thức update để xóa cache
  async updateById(id, updateData) {
    const item = await super.updateById(id, updateData);
    if (item && item.ownerId) {
      await this.clearUserCache(item.ownerId.toString());
    }
    return item;
  }

  async deleteById(id) {
    const item = await this.findById(id);
    if (item) {
      const userId = item.ownerId.toString();
      const result = await super.deleteById(id);
      await this.clearUserCache(userId);
      return result;
    }
    return false;
  }
}

module.exports = ItemRepository; 