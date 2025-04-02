'use strict';

const outfitModel = require('../db/models/outfit.model');
const itemModel = require('../db/models/item.model');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const mongoose = require('mongoose');

class OutfitService {
  // Tạo trang phục mới
  static async createOutfit(outfitData) {
    // Kiểm tra dữ liệu
    if (!outfitData.name || !outfitData.ownerId) {
      throw new BadRequestError('Thiếu thông tin trang phục');
    }
    
    // Khởi tạo với mảng items rỗng nếu không cung cấp
    if (!outfitData.items) {
      outfitData.items = [];
    }
    
    // Tạo outfit mới
    const newOutfit = await outfitModel.create({
      ...outfitData,
      inCloset: true,
      wearCount: 0,
      lastWorn: null
    });
    
    return newOutfit;
  }
  
  // Lấy tất cả trang phục của người dùng
  static async getAllOutfits({ ownerId, season, occasion, inCloset, limit, page }) {
    const filter = { ownerId };
    
    // Thêm các bộ lọc nếu được cung cấp
    if (season) filter.season = season;
    if (occasion) filter.occasion = occasion;
    if (inCloset !== undefined) filter.inCloset = inCloset;
    
    // Phân trang
    const options = {
      limit: parseInt(limit) || 20,
      page: parseInt(page) || 1,
      sort: { lastWorn: -1, updatedAt: -1 },
      populate: {
        path: 'items.itemId',
        select: 'name category color imageUrl'
      }
    };
    
    // Thực hiện truy vấn
    const outfits = await outfitModel.paginate(filter, options);
    
    return outfits;
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
    
    return outfit;
  }
  
  // Cập nhật thông tin trang phục
  static async updateOutfit(outfitId, userId, updateData) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    });
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
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
    
    // Xóa trang phục
    await outfitModel.findByIdAndDelete(outfitId);
    
    return { success: true };
  }
  
  // Đánh dấu trang phục đã mặc
  static async markOutfitAsWorn(outfitId, userId, wornDate) {
    // Kiểm tra trang phục tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    });
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục');
    }
    
    // Cập nhật thông tin mặc
    const date = wornDate ? new Date(wornDate) : new Date();
    
    const updatedOutfit = await outfitModel.findByIdAndUpdate(
      outfitId,
      { 
        $inc: { wearCount: 1 },
        $set: { lastWorn: date },
        $push: { wearHistory: { date } }
      },
      { new: true }
    );
    
    // Tăng lượt mặc của từng item trong outfit
    if (outfit.items && outfit.items.length > 0) {
      const itemIds = outfit.items.map(item => item.itemId);
      
      await itemModel.updateMany(
        { _id: { $in: itemIds } },
        { 
          $inc: { wearCount: 1 },
          $set: { lastWorn: date }
        }
      );
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
    
    // Thêm item vào outfit
    const updatedOutfit = await outfitModel.findByIdAndUpdate(
      outfitId,
      { $push: { items: { itemId } } },
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
      { $pull: { items: { itemId: mongoose.Types.ObjectId(itemId) } } },
      { new: true }
    ).populate('items.itemId');
    
    return updatedOutfit;
  }
  
  // Tìm kiếm trang phục phù hợp với điều kiện thời tiết
  static async findOutfitsForWeather(userId, temperature, weatherConditions, limit = 5) {
    // Xác định mùa dựa trên nhiệt độ
    let season = 'all';
    if (temperature < 10) season = 'winter';
    else if (temperature < 20) season = 'fall';
    else if (temperature < 30) season = 'spring';
    else season = 'summer';
    
    // Xây dựng query
    const query = {
      ownerId: userId,
      inCloset: true,
      $or: [
        { season },
        { season: 'all' }
      ]
    };
    
    // Thêm điều kiện dựa trên thời tiết (mưa, tuyết, v.v.)
    if (weatherConditions) {
      if (weatherConditions.includes('rain')) {
        query['tags'] = { $in: ['waterproof', 'rain-friendly'] };
      }
      
      if (weatherConditions.includes('snow')) {
        query['tags'] = { $in: ['winter', 'warm', 'snow'] };
      }
      
      if (weatherConditions.includes('windy')) {
        query['tags'] = { $in: ['windproof', 'layered'] };
      }
    }
    
    // Tìm kiếm outfits phù hợp
    const outfits = await outfitModel.find(query)
      .sort({ wearCount: -1 })
      .limit(limit)
      .populate('items.itemId');
    
    return outfits;
  }
  
  // Tạo trang phục mới từ danh sách items
  static async createOutfitFromItems(userId, name, itemIds, occasion, season) {
    // Kiểm tra xem các item có tồn tại và thuộc về người dùng không
    const items = await itemModel.find({
      _id: { $in: itemIds },
      ownerId: userId,
      inCloset: true
    });
    
    if (items.length !== itemIds.length) {
      throw new BadRequestError('Một số vật phẩm không tồn tại hoặc không thuộc về bạn');
    }
    
    // Tạo dữ liệu outfit
    const outfitData = {
      name,
      ownerId: userId,
      items: itemIds.map(itemId => ({ itemId })),
      occasion,
      season,
      inCloset: true,
      wearCount: 0
    };
    
    // Tạo outfit mới
    const newOutfit = await outfitModel.create(outfitData);
    
    // Lấy và trả về outfit đã populate items
    const populatedOutfit = await outfitModel.findById(newOutfit._id)
      .populate('items.itemId');
    
    return populatedOutfit;
  }
}

module.exports = OutfitService; 
