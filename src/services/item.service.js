'use strict';

const itemModel = require('../models/models/Item');
const outfitModel = require('../models/models/Outfit');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { Types } = require('mongoose');

class ItemService {
  // Tạo mới item
  static async createItem(itemData) {
    // Kiểm tra và làm sạch dữ liệu
    if (!itemData.name || !itemData.category) {
      throw new BadRequestError('Tên và danh mục vật phẩm là bắt buộc');
    }

    const newItem = await itemModel.create(itemData);
    return newItem;
  }

  // Lấy danh sách item của người dùng
  static async findUserItems({ userId, page = 1, limit = 20, filter = {}, sort = 'ctime' }) {
    // Thêm ownerId vào filter
    filter.ownerId = userId;
    
    // Xác định cách sắp xếp
    let sortOptions = {};
    switch (sort) {
      case 'ctime':
        sortOptions = { createdAt: -1 };
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
      case 'last_worn':
        sortOptions = { lastWorn: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // Đếm tổng số item
    const totalItems = await itemModel.countDocuments(filter);
    
    // Lấy danh sách item với phân trang
    const items = await itemModel.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    };
  }

  // Lấy chi tiết item
  static async findItemById(itemId, userId) {
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemModel.findOne({
      _id: itemId,
      ownerId: userId
    });
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    return item;
  }

  // Cập nhật item
  static async updateItem(itemId, userId, updateData) {
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemModel.findOne({
      _id: itemId,
      ownerId: userId
    });
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Cập nhật thông tin item
    const updatedItem = await itemModel.findByIdAndUpdate(
      itemId,
      { $set: updateData },
      { new: true }
    );
    
    return updatedItem;
  }

  // Xóa item
  static async deleteItem(itemId, userId) {
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemModel.findOne({
      _id: itemId,
      ownerId: userId
    });
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Kiểm tra xem item có trong outfit nào không
    const outfitWithItem = await outfitModel.findOne({
      'items.itemId': Types.ObjectId(itemId)
    });
    
    if (outfitWithItem) {
      // Xóa item khỏi outfit
      await outfitModel.updateMany(
        { 'items.itemId': Types.ObjectId(itemId) },
        { $pull: { items: { itemId: Types.ObjectId(itemId) } } }
      );
    }
    
    // Xóa item
    await itemModel.findByIdAndDelete(itemId);
    
    return { success: true, message: 'Vật phẩm đã được xóa' };
  }

  // Cập nhật trạng thái item
  static async updateItemStatus(itemId, userId, { inCloset, status }) {
    // Kiểm tra item tồn tại và thuộc về người dùng
    const item = await itemModel.findOne({
      _id: itemId,
      ownerId: userId
    });
    
    if (!item) {
      throw new NotFoundError('Không tìm thấy vật phẩm');
    }
    
    // Cập nhật trạng thái
    const updateData = {};
    if (inCloset !== undefined) updateData.inCloset = inCloset;
    if (status) updateData.status = status;
    
    const updatedItem = await itemModel.findByIdAndUpdate(
      itemId,
      { $set: updateData },
      { new: true }
    );
    
    return updatedItem;
  }
}

module.exports = ItemService; 