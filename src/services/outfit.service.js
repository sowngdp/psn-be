'use strict';

const outfitModel = require('../db/models/outfit.model');
const itemModel = require('../db/models/item.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const mongoose = require('mongoose');
const FirebaseStorage = require('../helpers/firebase.storage');
const { Types } = require('mongoose');
const { composeImages } = require('./image.service');
const firebaseService = require('./firebase.service');

class OutfitService {
  // Tạo trang phục mới với hỗ trợ hình ảnh tổng hợp
  static async createOutfit(outfitData, imageFile = null) {
    // Kiểm tra dữ liệu
    if (!outfitData.name || !outfitData.ownerId) {
      throw new BadRequestError('Thiếu thông tin trang phục');
    }
    
    // Khởi tạo với mảng items rỗng nếu không cung cấp
    if (!outfitData.items) {
      outfitData.items = [];
    }
    const itemIds = outfitData.items.map(item => item.itemId);
    // Kiểm tra tất cả items tồn tại và thuộc về người dùng
    const items = await itemModel.find({
      _id: { $in: itemIds },
      ownerId: outfitData.ownerId,
    });
    if (items.length !== itemIds.length) {
      throw new BadRequestError('Một số vật phẩm không tồn tại hoặc không thuộc về bạn');
    }
    console.log('Items found:', items.length);
    const fileImagePath = await composeImages(items,1000,1000);
    
    let imageUrl = await firebaseService.uploadFromLocalPath(fileImagePath,'image/png');
    console.log('Image URL:', imageUrl);
    // Tạo outfit mới
    const newOutfit = await outfitModel.create({
      ...outfitData,
      imageUrl: imageUrl,
      inCloset: true,
      wearCount: 0,
      lastWorn: null
    });
    
    return newOutfit;
  }

  // Lấy tất cả trang phục của người dùng
  static async getAllOutfits({ ownerId, season, occasion, inCloset, limit = 20, page = 1, sort }) {
    const filter = { ownerId };
    if (season) filter.season = season;
    if (occasion) filter.occasion = occasion;
    if (inCloset !== undefined) filter.inCloset = inCloset;
    
    const skip = (page - 1) * limit;
    
    // Xác định thứ tự sắp xếp
    let sortOption = { createdAt: -1 }; // Mặc định: mới nhất trước
    if (sort) {
      switch(sort) {
        case 'name':
          sortOption = { name: 1 };
          break;
        case 'name_desc':
          sortOption = { name: -1 };
          break;
        case 'wearCount':
          sortOption = { wearCount: -1 };
          break;
        case 'lastWorn':
          sortOption = { lastWorn: -1 };
          break;
        case 'ctime_asc':
          sortOption = { createdAt: 1 };
          break;
        default:
          sortOption = { createdAt: -1 }; // mặc định nếu sort không hợp lệ
      }
    }
    
    const [outfits, totalCount] = await Promise.all([
      outfitModel.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      outfitModel.countDocuments(filter)
    ]);
    
    return {
      docs: outfits,
      totalDocs: totalCount,
      limit: parseInt(limit),
      totalPages: Math.ceil(totalCount / limit),
      page: parseInt(page),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1
    };
  }
  
  // Lấy thông tin chi tiết trang phục
  static async getOutfitById(outfitId, userId) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    }).populate('items.itemId');
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
  }
  
  // Cập nhật thông tin trang phục
  static async updateOutfit(outfitId, userId, updateData, imageFile = null) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    });
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Nếu có file ảnh mới, tải lên và cập nhật URL
    if (imageFile) {
      try {
        const firebaseStorage = FirebaseStorage.getInstance();
        let imageUrl;
        
        // Nếu outfit đã có ảnh, cập nhật ảnh mới
        if (outfit.imageUrl) {
          imageUrl = await firebaseStorage.updateImage(outfit.imageUrl, imageFile);
        } else {
          imageUrl = await firebaseStorage.uploadImage(imageFile);
        }
        
        if (imageUrl) {
          updateData.imageUrl = imageUrl;
        }
      } catch (error) {
        console.error('Lỗi khi cập nhật hình ảnh outfit:', error);
        // Vẫn tiếp tục cập nhật outfit dù có lỗi khi cập nhật hình ảnh
      }
    }
    
    // Cập nhật trang phục
    const updatedOutfit = await outfitModel.findByIdAndUpdate(
      outfitId,
      { $set: updateData },
      { new: true }
    ).populate('items.itemId');
    
    return updatedOutfit;
  }
  
  // Xóa trang phục
  static async deleteOutfit(outfitId, userId) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    });
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Xóa hình ảnh từ Firebase Storage nếu có
    if (outfit.imageUrl) {
      try {
        const firebaseStorage = FirebaseStorage.getInstance();
        await firebaseStorage.deleteImage(outfit.imageUrl);
      } catch (error) {
        console.error('Lỗi khi xóa hình ảnh outfit:', error);
        // Vẫn tiếp tục xóa outfit dù có lỗi khi xóa hình ảnh
      }
    }
    
    // Xóa trang phục
    await outfitModel.findByIdAndDelete(outfitId);
    
    return { success: true };
  }
  
  // Đánh dấu trang phục đã mặc và cập nhật các items liên quan
  static async markOutfitAsWorn(outfitId, userId, wornDate) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    }).populate('items.itemId');
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Cập nhật thông tin mặc
    const date = wornDate ? new Date(wornDate) : new Date();
    
    // Tạo bản ghi lịch sử chi tiết hơn với thông tin thời tiết, địa điểm, event nếu có
    const wearHistoryEntry = { 
      date,
      weather: outfit.weather || null,
      location: outfit.location || null,
      event: outfit.occasion || null
    };
    
    const updatedOutfit = await outfitModel.findByIdAndUpdate(
      outfitId,
      { 
        $inc: { wearCount: 1 },
        $set: { lastWorn: date },
        $push: { wearHistory: wearHistoryEntry }
      },
      { new: true }
    );
    
    // Tăng lượt mặc của từng item trong outfit
    if (outfit.items && outfit.items.length > 0) {
      const updateOperations = outfit.items.map(item => {
        // Chỉ cập nhật các items có hiệu lực
        if (!item.itemId) return null;
        
        return {
          updateOne: {
            filter: { _id: item.itemId._id },
            update: { 
              $inc: { wearCount: 1 },
              $set: { lastWorn: date },
              $push: { 
                wearHistory: { 
                  date,
                  outfitId: outfit._id,
                  outfitName: outfit.name
                } 
              }
            }
          }
        };
      }).filter(Boolean); // Lọc bỏ các giá trị null
      
      if (updateOperations.length > 0) {
        await itemModel.bulkWrite(updateOperations);
      }
    }
    
    return updatedOutfit;
  }
  
  // Thêm item vào trang phục
  static async addItemToOutfit(outfitId, userId, itemId) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    });
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemModel.findOne({
      _id: itemId,
      ownerId: userId,
      inCloset: true
    });
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Kiểm tra xem item đã có trong outfit chưa
    const itemExists = outfit.items.some(outfitItem => 
      outfitItem.itemId.toString() === itemId
    );
    
    if (itemExists) {
      throw new BadRequestError('Vật phẩm đã có trong trang phục');
    }
    
    // Thêm item vào outfit với metadata mở rộng
    const updatedOutfit = await outfitModel.findByIdAndUpdate(
      outfitId,
      { 
        $push: { 
          items: { 
            itemId,
            position: outfit.items.length, // Vị trí mặc định là cuối danh sách
            layerOrder: outfit.items.length, // Thứ tự layer mặc định
            visible: true // Item mặc định là hiển thị
          } 
        } 
      },
      { new: true }
    ).populate('items.itemId');
    
    return updatedOutfit;
  }
  
  // Xóa item khỏi trang phục
  static async removeItemFromOutfit(outfitId, userId, itemId) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    });
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Kiểm tra xem item có trong outfit không
    const itemExists = outfit.items.some(outfitItem => 
      outfitItem.itemId.toString() === itemId
    );
    
    if (!itemExists) {
      throw new BadRequestError('Vật phẩm không có trong trang phục');
    }
    
    // Xóa item khỏi outfit
    const updatedOutfit = await outfitModel.findByIdAndUpdate(
      outfitId,
      { $pull: { items: { itemId: Types.ObjectId(itemId) } } },
      { new: true }
    ).populate('items.itemId');
    
    return updatedOutfit;
  }
  
  // Tìm kiếm trang phục phù hợp với điều kiện thời tiết - cải tiến
  static async findOutfitsForWeather(userId, temperature, weatherConditions, limit = 5) {
    // Xác định mùa dựa trên nhiệt độ
    let season = 'all';
    
    if (temperature !== undefined) {
      if (temperature < 10) season = 'winter';
      else if (temperature < 20) season = 'fall';
      else if (temperature < 30) season = 'spring';
      else season = 'summer';
    }
    
    // Xây dựng query
    const query = {
      ownerId: userId,
      inCloset: true
    };
    
    // Thêm điều kiện mùa nếu có
    if (season !== 'all') {
      query.$or = [
        { season },
        { season: 'all' }
      ];
    }
    
    // Thêm điều kiện dựa trên thời tiết (mưa, tuyết, v.v.)
    let weatherTags = [];
    
    if (weatherConditions) {
      if (weatherConditions.includes('rain')) {
        weatherTags.push('waterproof', 'rain-friendly');
      }
      if (weatherConditions.includes('snow')) {
        weatherTags.push('warm', 'snow-appropriate');
      }
      if (weatherConditions.includes('wind')) {
        weatherTags.push('windproof', 'layered');
      }
      if (weatherConditions.includes('sunny')) {
        weatherTags.push('light', 'breathable', 'sun-protection');
      }
      
      if (weatherTags.length > 0) {
        query.tags = { $in: weatherTags };
      }
    }
    
    // Tìm kiếm các outfits phù hợp và sắp xếp theo độ phù hợp
    const outfits = await outfitModel.find(query)
      .populate('items.itemId')
      .limit(parseInt(limit));
    
    // Cải thiện: Tính điểm phù hợp cho mỗi outfit dựa trên nhiều tiêu chí
    const scoredOutfits = outfits.map(outfit => {
      let score = 0;
      
      // Điểm cho mùa phù hợp
      if (season && outfit.season === season) score += 3;
      else if (outfit.season === 'all') score += 1;
      
      // Điểm cho tags phù hợp
      if (outfit.tags && weatherTags.length > 0) {
        const matchingTags = outfit.tags.filter(tag => weatherTags.includes(tag));
        score += matchingTags.length;
      }
      
      // Điểm cho độ phổ biến (số lần mặc)
      score += Math.min(outfit.wearCount / 2, 3); // Tối đa 3 điểm
      
      // Thêm một chút ngẫu nhiên để có sự đa dạng
      score += Math.random();
      
      return { outfit, score };
    });
    
    // Sắp xếp theo điểm và trả về kết quả
    scoredOutfits.sort((a, b) => b.score - a.score);
    
    return scoredOutfits.map(item => item.outfit);
  }
  
  // Tạo outfit từ danh sách items
  static async createOutfitFromItems(userId, name, itemIds, occasion, season) {
    // Kiểm tra người dùng tồn tại
    if (!userId || !name || !Array.isArray(itemIds) || itemIds.length === 0) {
      throw new BadRequestError('Thiếu thông tin cần thiết để tạo trang phục');
    }
    
    // Kiểm tra tất cả items tồn tại và thuộc về người dùng
    const items = await itemModel.find({
      _id: { $in: itemIds },
      ownerId: userId,
      inCloset: true
    });
    
    if (items.length !== itemIds.length) {
      throw new BadRequestError('Một số vật phẩm không tồn tại hoặc không thuộc về bạn');
    }
    
    // Tạo mảng items cho outfit
    const outfitItems = itemIds.map((itemId, index) => ({
      itemId,
      position: index,
      layerOrder: index,
      visible: true
    }));
    
    // Tạo outfit mới
    const newOutfit = await outfitModel.create({
      name,
      ownerId: userId,
      items: outfitItems,
      occasion,
      season,
      inCloset: true,
      wearCount: 0,
      lastWorn: null
    });
    
    return await outfitModel.findById(newOutfit._id).populate('items.itemId');
  }
  
  // Tạo hình ảnh tổng hợp cho outfit
  static async generateOutfitImage(outfitId, userId) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    }).populate('items.itemId');
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Kiểm tra outfit có ít nhất một item
    if (!outfit.items || outfit.items.length === 0) {
      throw new BadRequestError('Trang phục không có vật phẩm nào để tạo hình ảnh');
    }
    
    // Lấy URLs của tất cả items
    const itemImageUrls = outfit.items
      .filter(item => item.itemId && item.itemId.imageUrl)
      .map(item => item.itemId.imageUrl);
    
    if (itemImageUrls.length === 0) {
      throw new BadRequestError('Không có hình ảnh nào cho các vật phẩm trong trang phục');
    }
    
    // Gọi dịch vụ tạo hình ảnh composite (giả định)
    // Đây là nơi bạn sẽ gọi một API hoặc dịch vụ để tạo hình ảnh từ các itemImageUrls
    // Trong ví dụ này, chúng tôi giả định là có một dịch vụ và trả về URL của hình ảnh đầu tiên
    const compositeImageUrl = itemImageUrls[0]; // Placeholder - thay thế bằng dịch vụ thực tế
    
    // Cập nhật URL hình ảnh cho outfit
    const updatedOutfit = await outfitModel.findByIdAndUpdate(
      outfitId,
      { $set: { imageUrl: compositeImageUrl } },
      { new: true }
    ).populate('items.itemId');
    
    return updatedOutfit;
  }
  
  // Tìm các outfits chứa một item cụ thể
  static async findOutfitsContainingItem(userId, itemId, page = 1, limit = 20) {
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemModel.findOne({
      _id: itemId,
      ownerId: userId
    });
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Tìm các outfits chứa item này
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: {
        path: 'items.itemId',
        select: 'name category color imageUrl'
      }
    };
    
    const outfits = await outfitModel.paginate({
      ownerId: userId,
      'items.itemId': Types.ObjectId(itemId)
    }, options);
    
    return outfits;
  }
  
  // Gợi ý trang phục dựa trên lịch sử và thời tiết
  static async generateOutfitRecommendations(userId, params = {}) {
    // Lấy thông tin từ tham số
    const { occasion, temperature, weatherConditions, limit = 5 } = params;
    
    // Xác định mùa dựa trên nhiệt độ nếu có
    let season = null;
    if (temperature !== undefined) {
      if (temperature < 10) season = 'winter';
      else if (temperature < 20) season = 'fall';
      else if (temperature < 30) season = 'spring';
      else season = 'summer';
    }
    
    // Xây dựng query cơ bản
    const query = {
      ownerId: userId,
      inCloset: true
    };
    
    // Thêm các điều kiện tìm kiếm
    if (season) {
      query.$or = [{ season }, { season: 'all' }];
    }
    
    if (occasion) {
      query.occasion = occasion;
    }
    
    // Lấy các outfits phù hợp điều kiện cơ bản
    const outfits = await outfitModel.find(query)
      .populate('items.itemId')
      .sort({ wearCount: -1 }) // Ưu tiên outfits được mặc nhiều
      .limit(limit * 3); // Lấy nhiều hơn để có thể sắp xếp và lọc
    
    // Tính điểm phù hợp cho mỗi outfit
    const scoredOutfits = outfits.map(outfit => {
      let score = 0;
      
      // Điểm cho mùa phù hợp
      if (season && outfit.season === season) score += 3;
      else if (outfit.season === 'all') score += 1;
      
      // Điểm cho sự kiện phù hợp
      if (occasion && outfit.occasion === occasion) score += 5;
      
      // Điểm cho thời tiết phù hợp nếu có tags
      if (weatherConditions && outfit.tags) {
        let weatherTags = [];
        
        if (weatherConditions.includes('rain')) {
          weatherTags.push('waterproof', 'rain-friendly');
        }
        if (weatherConditions.includes('snow')) {
          weatherTags.push('warm', 'snow-appropriate');
        }
        if (weatherConditions.includes('wind')) {
          weatherTags.push('windproof', 'layered');
        }
        if (weatherConditions.includes('sunny')) {
          weatherTags.push('light', 'breathable', 'sun-protection');
        }
        
        const matchingTags = outfit.tags.filter(tag => weatherTags.includes(tag));
        score += matchingTags.length;
      }
      
      // Điểm cho độ phổ biến (số lần mặc)
      score += Math.min(outfit.wearCount / 2, 3); // Tối đa 3 điểm
      
      // Ưu tiên outfits mới hơn nếu lastWorn tồn tại
      if (outfit.lastWorn) {
        const daysSinceLastWorn = Math.floor((new Date() - new Date(outfit.lastWorn)) / (1000 * 60 * 60 * 24));
        // Cho điểm cao hơn nếu đã lâu không mặc (giới hạn ở 30 ngày)
        score += Math.min(daysSinceLastWorn / 10, 3);
      } else {
        // Outfit chưa từng mặc, cho điểm cao
        score += 3;
      }
      
      // Thêm một chút ngẫu nhiên để có sự đa dạng
      score += Math.random();
      
      return { outfit, score };
    });
    
    // Sắp xếp theo điểm và trả về kết quả
    scoredOutfits.sort((a, b) => b.score - a.score);
    
    return scoredOutfits.slice(0, limit).map(item => item.outfit);
  }
  
  // Chia sẻ outfit với người dùng khác
  static async shareOutfit(outfitId, userId, shareWith, permissions = 'view') {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    });
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Kiểm tra người dùng đã chia sẻ trước đó chưa
    const alreadyShared = outfit.sharedWith && outfit.sharedWith.some(share => 
      share.userId.toString() === shareWith
    );
    
    let updatedOutfit;
    
    if (alreadyShared) {
      // Cập nhật quyền nếu đã chia sẻ
      updatedOutfit = await outfitModel.findOneAndUpdate(
        { 
          _id: outfitId, 
          'sharedWith.userId': Types.ObjectId(shareWith) 
        },
        { 
          $set: { 'sharedWith.$.permissions': permissions } 
        },
        { new: true }
      );
    } else {
      // Thêm mới nếu chưa chia sẻ
      updatedOutfit = await outfitModel.findByIdAndUpdate(
        outfitId,
        { 
          $push: { 
            sharedWith: { 
              userId: Types.ObjectId(shareWith), 
              permissions,
              sharedAt: new Date()
            } 
          } 
        },
        { new: true }
      );
    }
    
    return updatedOutfit;
  }
  
  // Lấy thống kê về outfits
  static async getOutfitStatistics(userId) {
    // Tổng số outfits
    const totalOutfits = await outfitModel.countDocuments({ ownerId: userId });
    
    // Phân tích theo mùa
    const seasonCounts = await outfitModel.aggregate([
      { $match: { ownerId: Types.ObjectId(userId) } },
      { $group: { _id: '$season', count: { $sum: 1 } } }
    ]);
    
    // Phân tích theo dịp
    const occasionCounts = await outfitModel.aggregate([
      { $match: { ownerId: Types.ObjectId(userId) } },
      { $group: { _id: '$occasion', count: { $sum: 1 } } }
    ]);
    
    // Outfits được mặc nhiều nhất
    const mostWorn = await outfitModel.find({ ownerId: userId })
      .sort({ wearCount: -1 })
      .limit(5)
      .select('name wearCount lastWorn');
    
    // Outfits chưa từng mặc
    const neverWorn = await outfitModel.find({ 
      ownerId: userId,
      $or: [
        { wearCount: 0 },
        { wearCount: { $exists: false } }
      ]
    })
      .select('name createdAt')
      .limit(5);
    
    // Phân tích thời gian sử dụng
    const recentlyUsed = await outfitModel.find({
      ownerId: userId,
      lastWorn: { $ne: null }
    })
      .sort({ lastWorn: -1 })
      .limit(5)
      .select('name lastWorn');
    
    return {
      totalOutfits,
      bySeasons: seasonCounts,
      byOccasions: occasionCounts,
      mostWorn,
      neverWorn,
      recentlyUsed
    };
  }
}

module.exports = OutfitService; 
