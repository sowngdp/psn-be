'use strict';

const BaseRepository = require('./base.repository');
const Outfit = require('../models/outfit.model');
const { Types } = require('mongoose');

/**
 * Repository chuyên biệt cho Outfit model
 * @class OutfitRepository
 * @extends BaseRepository
 */
class OutfitRepository extends BaseRepository {
  constructor() {
    super(Outfit);
  }

  /**
   * Tìm tất cả outfit của một người dùng
   * @param {Object} options - Các tùy chọn
   * @param {string} options.userId - ID của người dùng sở hữu outfits
   * @param {number} options.page - Trang hiện tại
   * @param {number} options.limit - Số outfits mỗi trang
   * @param {Object} options.filter - Bộ lọc (season, occasion, etc.)
   * @param {string} options.sort - Cách sắp xếp
   * @param {boolean} options.includeMetadata - Có bao gồm metadata hay không
   * @param {boolean} options.populateItems - Có populate items hay không
   * @returns {Promise<Object>} Danh sách outfits và thông tin phân trang
   */
  async findUserOutfits({ 
    userId, 
    page = 1, 
    limit = 20, 
    filter = {}, 
    sort = 'ctime',
    includeMetadata = false,
    populateItems = true
  }) {
    // Thêm ownerId vào filter
    const queryFilter = { ownerId: userId };
    
    // Xử lý các filter nâng cao
    if (filter.season) queryFilter.season = filter.season;
    if (filter.occasion) queryFilter.occasion = filter.occasion;
    if (filter.inCloset !== undefined) queryFilter.inCloset = filter.inCloset;
    if (filter.isFavorite !== undefined) queryFilter.isFavorite = filter.isFavorite;
    
    // Xử lý tìm kiếm theo text
    if (filter.search) {
      queryFilter.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { occasion: { $regex: filter.search, $options: 'i' } },
        { tags: { $regex: filter.search, $options: 'i' } }
      ];
    }
    
    // Xử lý lọc theo mảng giá trị
    if (filter.seasons && filter.seasons.length) queryFilter.season = { $in: filter.seasons };
    if (filter.occasions && filter.occasions.length) queryFilter.occasion = { $in: filter.occasions };
    if (filter.styleTypes && filter.styleTypes.length) queryFilter.styleTypes = { $in: filter.styleTypes };
    if (filter.tags && filter.tags.length) queryFilter.tags = { $in: filter.tags };
    if (filter.weather && filter.weather.length) queryFilter.weather = { $in: filter.weather };
    
    // Lọc theo item
    if (filter.containsItem) {
      queryFilter['items.itemId'] = Types.ObjectId(filter.containsItem);
    }
    
    // Lọc theo số lượng items
    if (filter.minItems) {
      queryFilter.$expr = { $gte: [{ $size: '$items' }, filter.minItems] };
    }
    if (filter.maxItems) {
      queryFilter.$expr = queryFilter.$expr || {};
      if (queryFilter.$expr.$gte) {
        queryFilter.$expr = { 
          $and: [
            { $gte: [{ $size: '$items' }, filter.minItems] },
            { $lte: [{ $size: '$items' }, filter.maxItems] }
          ]
        };
      } else {
        queryFilter.$expr = { $lte: [{ $size: '$items' }, filter.maxItems] };
      }
    }
    
    // Lọc theo styleScore
    if (filter.minStyleScore !== undefined) {
      queryFilter.styleScore = { $gte: filter.minStyleScore };
    }
    if (filter.maxStyleScore !== undefined) {
      queryFilter.styleScore = queryFilter.styleScore || {};
      queryFilter.styleScore.$lte = filter.maxStyleScore;
    }
    
    // Lọc theo ratings
    if (filter.minRating) {
      queryFilter['meta.analytics.averageRating'] = { $gte: filter.minRating };
    }
    
    // Lọc theo ngày tạo, lần cuối sử dụng
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
    
    // Lọc theo chia sẻ
    if (filter.isShared !== undefined) queryFilter.isShared = filter.isShared;
    if (filter.isPublic !== undefined) queryFilter['shareSettings.isPublic'] = filter.isPublic;
    
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
      case 'rating':
        sortOptions = { 'meta.analytics.averageRating': -1 };
        break;
      case 'style_score':
        sortOptions = { styleScore: -1 };
        break;
      case 'items_count':
        sortOptions = { itemCount: -1 };
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
    
    // Xác định populate options
    const populateOptions = populateItems 
      ? { path: 'items.itemId', select: 'name category color imageUrl images inCloset' }
      : null;

    return this.findMany({
      filter: queryFilter,
      page,
      limit,
      sort: sortOptions,
      projection,
      populate: populateOptions
    });
  }

  /**
   * Tìm outfit thuộc về người dùng cụ thể
   * @param {string} outfitId - ID của outfit
   * @param {string} userId - ID của người dùng
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {Promise<Document|null>} Outfit nếu tìm thấy, null nếu không
   */
  async findUserOutfit(outfitId, userId, options = {}) {
    const query = {
      _id: outfitId,
      ownerId: userId
    };
    
    // Nếu yêu cầu cụ thể về trạng thái inCloset
    if (options.inCloset !== undefined) {
      query.inCloset = options.inCloset;
    }
    
    const projection = options.projection || null;
    
    if (options.populate) {
      return this.findOne(query, {
        projection,
        populate: { 
          path: 'items.itemId', 
          select: options.populateFields || 'name imageUrl category color images inCloset' 
        }
      });
    }
    
    return this.findOne(query, { projection });
  }

  /**
   * Tìm outfits chứa item cụ thể
   * @param {string} itemId - ID của item
   * @param {string} userId - ID của người dùng (nếu cần lọc theo người dùng)
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {Promise<Document[]>} Mảng các outfits chứa item
   */
  async findOutfitsContainingItem(itemId, userId = null, options = {}) {
    const { limit = 20, sort = { createdAt: -1 }, inCloset = true, populate = false } = options;
    
    const query = { 
      'items.itemId': Types.ObjectId(itemId),
      inCloset
    };
    
    if (userId) {
      query.ownerId = userId;
    }
    
    let findQuery = this.model.find(query);
    
    if (sort) findQuery = findQuery.sort(sort);
    if (limit > 0) findQuery = findQuery.limit(limit);
    
    if (populate) {
      findQuery = findQuery.populate({
        path: 'items.itemId',
        select: 'name imageUrl category color images inCloset'
      });
    }
    
    return findQuery.exec();
  }

  /**
   * Tìm outfits phù hợp với điều kiện thời tiết
   * @param {string} userId - ID của người dùng
   * @param {Object} weatherData - Thông tin thời tiết
   * @param {string[]} weatherData.conditions - Các điều kiện thời tiết
   * @param {number} weatherData.temperature - Nhiệt độ
   * @param {Object} options - Các tùy chọn bổ sung
   * @returns {Promise<Document[]>} Danh sách outfits phù hợp
   */
  async findOutfitsByWeather(userId, weatherData, options = {}) {
    const { limit = 10, excludeOutfitIds = [], season = null } = options;
    
    // Xác định mùa dựa vào nhiệt độ nếu không được cung cấp
    let querySeasons = [];
    if (season) {
      querySeasons = [season];
    } else if (weatherData.temperature !== undefined) {
      // Phân loại mùa dựa trên nhiệt độ (có thể điều chỉnh theo nhu cầu)
      if (weatherData.temperature > 30) {
        querySeasons = ['summer'];
      } else if (weatherData.temperature > 20) {
        querySeasons = ['spring', 'summer', 'fall'];
      } else if (weatherData.temperature > 10) {
        querySeasons = ['spring', 'fall'];
      } else {
        querySeasons = ['winter'];
      }
    }
    
    // Build query
    const query = {
      ownerId: userId,
      inCloset: true
    };
    
    // Lọc theo mùa
    if (querySeasons.length > 0) {
      query.$or = [
        { season: { $in: querySeasons } },
        { season: 'all' }
      ];
    }
    
    // Lọc theo điều kiện thời tiết
    if (weatherData.conditions && weatherData.conditions.length > 0) {
      query.$or = query.$or || [];
      query.$or.push(
        { weather: { $in: weatherData.conditions } },
        { weather: 'any' }
      );
    }
    
    // Loại trừ các outfits đã chỉ định
    if (excludeOutfitIds.length > 0) {
      const objectIds = excludeOutfitIds.map(id => Types.ObjectId(id));
      query._id = { $nin: objectIds };
    }
    
    return this.model
      .find(query)
      .populate({ path: 'items.itemId', select: 'name imageUrl category color images inCloset' })
      .sort({ wearCount: -1, styleScore: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Thêm item vào outfit
   * @param {string} outfitId - ID của outfit
   * @param {string} itemId - ID của item cần thêm
   * @param {Object} itemDetails - Chi tiết về vị trí, thứ tự, etc. của item trong outfit
   * @returns {Promise<Document|null>} Outfit đã cập nhật hoặc null nếu không tìm thấy
   */
  async addItemToOutfit(outfitId, itemId, itemDetails = {}) {
    // Kiểm tra xem item đã có trong outfit chưa
    const outfitWithItem = await this.model.findOne({
      _id: outfitId,
      'items.itemId': Types.ObjectId(itemId)
    });
    
    if (outfitWithItem) {
      // Item đã tồn tại, cập nhật thông tin
      return this.model.findOneAndUpdate(
        { _id: outfitId, 'items.itemId': Types.ObjectId(itemId) },
        { $set: { 'items.$': { itemId: Types.ObjectId(itemId), ...itemDetails } } },
        { new: true }
      );
    } else {
      // Item chưa tồn tại, thêm mới
      return this.model.findByIdAndUpdate(
        outfitId,
        { $push: { items: { itemId: Types.ObjectId(itemId), ...itemDetails } } },
        { new: true }
      );
    }
  }

  /**
   * Xóa item khỏi outfit
   * @param {string} outfitId - ID của outfit
   * @param {string} itemId - ID của item cần xóa
   * @returns {Promise<Document|null>} Outfit đã cập nhật hoặc null nếu không tìm thấy
   */
  async removeItemFromOutfit(outfitId, itemId) {
    return this.model.findByIdAndUpdate(
      outfitId,
      { $pull: { items: { itemId: Types.ObjectId(itemId) } } },
      { new: true }
    );
  }

  /**
   * Cập nhật thứ tự các items trong outfit
   * @param {string} outfitId - ID của outfit
   * @param {Array<{itemId: string, position: string, layerOrder: number, coordinates: Object}>} itemsData - Mảng thông tin mới
   * @returns {Promise<Document|null>} Outfit đã cập nhật hoặc null nếu không tìm thấy
   */
  async updateItemsOrder(outfitId, itemsData) {
    // Lấy outfit hiện tại
    const outfit = await this.findById(outfitId);
    
    if (!outfit) return null;
    
    // Tạo map từ itemId đến item hiện tại
    const itemMap = new Map();
    outfit.items.forEach(item => {
      itemMap.set(item.itemId.toString(), item);
    });
    
    // Tạo mảng items mới với thứ tự đã cập nhật
    const updatedItems = itemsData.map(({ itemId, position, layerOrder, coordinates, isVisible, notes }) => {
      const existingItem = itemMap.get(itemId.toString());
      if (!existingItem) return null;
      
      // Tạo item mới với thông tin đã cập nhật
      const updatedItem = {
        itemId: existingItem.itemId,
        position: position || existingItem.position,
        layerOrder: layerOrder !== undefined ? layerOrder : (existingItem.layerOrder || 0),
        isVisible: isVisible !== undefined ? isVisible : (existingItem.isVisible !== undefined ? existingItem.isVisible : true),
        notes: notes || existingItem.notes
      };
      
      // Thêm coordinates nếu có
      if (coordinates) {
        updatedItem.coordinates = coordinates;
      } else if (existingItem.coordinates) {
        updatedItem.coordinates = existingItem.coordinates;
      }
      
      return updatedItem;
    }).filter(Boolean); // Lọc bỏ các giá trị null
    
    // Cập nhật outfit với items đã sắp xếp lại
    return this.updateById(outfitId, { items: updatedItems });
  }

  /**
   * Đánh dấu outfit đã được mặc
   * @param {string} outfitId - ID của outfit
   * @param {Object} wearData - Thông tin về việc mặc
   * @returns {Promise<Document|null>} Outfit đã cập nhật hoặc null nếu không tìm thấy
   */
  async markOutfitAsWorn(outfitId, wearData = {}) {
    const updateQuery = { 
      $inc: { wearCount: 1 },
      $set: { lastWorn: wearData.date || new Date() }
    };
    
    // Thêm vào lịch sử nếu có dữ liệu
    if (Object.keys(wearData).length > 0) {
      const historyEntry = {
        date: wearData.date || new Date(),
        occasion: wearData.occasion,
        weather: wearData.weather,
        temperature: wearData.temperature,
        location: wearData.location,
        notes: wearData.notes,
        rating: wearData.rating
      };
      
      updateQuery.$push = { wearHistory: historyEntry };
      
      // Cập nhật thống kê theo mùa nếu có thông tin mùa
      if (wearData.season && ['spring', 'summer', 'fall', 'winter'].includes(wearData.season)) {
        const seasonKey = `meta.analytics.seasonUsage.${wearData.season}`;
        updateQuery.$inc = updateQuery.$inc || {};
        updateQuery.$inc[seasonKey] = 1;
      }
      
      // Cập nhật average rating nếu có
      if (wearData.rating) {
        // Cập nhật rating sẽ được xử lý trong pre-save middleware
      }
    }
    
    const updatedOutfit = await this.model.findByIdAndUpdate(
      outfitId,
      updateQuery,
      { new: true }
    );
    
    return updatedOutfit;
  }

  /**
   * Lấy thống kê về outfits của người dùng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Object>} Thống kê về outfits
   */
  async getOutfitStatistics(userId) {
    const pipeline = [
      { $match: { ownerId: Types.ObjectId(userId) } },
      {
        $facet: {
          // Đếm số lượng theo mùa
          seasonStats: [
            { $group: { _id: '$season', count: { $sum: 1 } } }
          ],
          // Đếm số lượng theo occasion
          occasionStats: [
            { $group: { _id: '$occasion', count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          // Đếm số lượng theo styleTypes
          styleStats: [
            { $unwind: '$styleTypes' },
            { $group: { _id: '$styleTypes', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          // Outfits thêm vào theo tháng
          outfitsByMonth: [
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
                totalOutfits: { $sum: 1 },
                activeOutfits: { $sum: { $cond: [{ $eq: ['$inCloset', true] }, 1, 0] } },
                favoriteOutfits: { $sum: { $cond: [{ $eq: ['$isFavorite', true] }, 1, 0] } },
                unwornOutfits: { $sum: { $cond: [{ $eq: ['$wearCount', 0] }, 1, 0] } },
                averageWears: { $avg: '$wearCount' },
                averageRating: { $avg: '$meta.analytics.averageRating' },
                averageStyleScore: { $avg: '$styleScore' }
              }
            }
          ],
          // Top outfits by wear count
          topOutfits: [
            { $match: { wearCount: { $gt: 0 } } },
            { $sort: { wearCount: -1 } },
            { $limit: 5 },
            { $project: { name: 1, wearCount: 1, imageUrl: 1, images: 1 } }
          ]
        }
      }
    ];
    
    const result = await this.model.aggregate(pipeline);
    return result[0];
  }

  /**
   * Lấy danh sách outfits được sử dụng nhiều nhất
   * @param {string} userId - ID người dùng
   * @param {number} limit - Số lượng outfits trả về
   * @returns {Promise<Document[]>} Danh sách outfits
   */
  async getMostUsedOutfits(userId, limit = 10) {
    return this.model.find(
      { ownerId: userId, wearCount: { $gt: 0 } },
      { name: 1, season: 1, occasion: 1, wearCount: 1, lastWorn: 1, imageUrl: 1, images: 1 }
    )
    .sort({ wearCount: -1 })
    .limit(limit);
  }

  /**
   * Cập nhật thông tin chia sẻ của outfit
   * @param {string} outfitId - ID của outfit
   * @param {Object} shareSettings - Các thiết lập chia sẻ
   * @returns {Promise<Document|null>} Outfit đã cập nhật
   */
  async updateShareSettings(outfitId, shareSettings) {
    const updateData = {};
    
    if (shareSettings.isShared !== undefined) {
      updateData.isShared = shareSettings.isShared;
    }
    
    if (shareSettings.isPublic !== undefined) {
      updateData['shareSettings.isPublic'] = shareSettings.isPublic;
    }
    
    if (shareSettings.allowComments !== undefined) {
      updateData['shareSettings.allowComments'] = shareSettings.allowComments;
    }
    
    if (shareSettings.sharedWith) {
      // Thêm người dùng vào danh sách chia sẻ
      return this.model.findByIdAndUpdate(
        outfitId,
        {
          $set: updateData,
          $addToSet: { 'shareSettings.sharedWith': shareSettings.sharedWith }
        },
        { new: true }
      );
    }
    
    if (shareSettings.removeSharedUser) {
      // Xóa người dùng khỏi danh sách chia sẻ
      return this.model.findByIdAndUpdate(
        outfitId,
        {
          $set: updateData,
          $pull: { 'shareSettings.sharedWith': { userId: Types.ObjectId(shareSettings.removeSharedUser) } }
        },
        { new: true }
      );
    }
    
    return this.model.findByIdAndUpdate(
      outfitId,
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Tìm các outfits được chia sẻ công khai
   * @param {Object} options - Các tùy chọn tìm kiếm
   * @returns {Promise<Document[]>} Danh sách outfits
   */
  async findPublicOutfits(options = {}) {
    const { limit = 20, page = 1, sort = { wearCount: -1 }, filter = {} } = options;
    
    const query = {
      isShared: true,
      'shareSettings.isPublic': true
    };
    
    // Áp dụng các bộ lọc bổ sung
    if (filter.season) query.season = filter.season;
    if (filter.occasion) query.occasion = filter.occasion;
    if (filter.styleTypes && filter.styleTypes.length) query.styleTypes = { $in: filter.styleTypes };
    
    const skip = (page - 1) * limit;
    
    return this.model.find(query)
      .populate({ path: 'ownerId', select: 'name avatar' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }
}

module.exports = new OutfitRepository(); 