'use strict';

const ItemService = require('../../services/item.service');
const { OK, CREATED } = require('../../core/success.response');

class ItemController {
  // Tạo mới item
  static async createItem(req, res, next) {
    try {
      const userId = req.user.userId;
      const itemData = { ...req.body, ownerId: userId };
      const newItem = await ItemService.createItem(itemData);
      return new CREATED({
        message: 'Tạo mới vật phẩm thành công',
        metadata: newItem
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách item của người dùng
  static async getUserItems(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page, limit, sort, filter, category } = req.query;
      
      // Xây dựng filter dựa trên query parameter
      const filterOptions = { ownerId: userId };
      if (category) filterOptions.category = category;
      if (filter) {
        try {
          const parsedFilter = JSON.parse(filter);
          Object.assign(filterOptions, parsedFilter);
        } catch (error) {
          console.log('Filter parse error:', error);
        }
      }

      const items = await ItemService.findUserItems({
        userId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort: sort || 'ctime',
        filter: filterOptions
      });

      return new OK({
        message: 'Lấy danh sách vật phẩm thành công',
        metadata: items
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy chi tiết item
  static async getItemById(req, res, next) {
    try {
      const itemId = req.params.id;
      const userId = req.user.userId;
      const item = await ItemService.findItemById(itemId, userId);
      return new OK({
        message: 'Lấy thông tin vật phẩm thành công',
        metadata: item
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật item
  static async updateItem(req, res, next) {
    try {
      const itemId = req.params.id;
      const userId = req.user.userId;
      const updateData = req.body;
      const updatedItem = await ItemService.updateItem(itemId, userId, updateData);
      return new OK({
        message: 'Cập nhật vật phẩm thành công',
        metadata: updatedItem
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Xóa item
  static async deleteItem(req, res, next) {
    try {
      const itemId = req.params.id;
      const userId = req.user.userId;
      const result = await ItemService.deleteItem(itemId, userId);
      return new OK({
        message: 'Xóa vật phẩm thành công',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật trạng thái item (đang trong tủ quần áo, đã bán, cho đi, v.v.)
  static async updateItemStatus(req, res, next) {
    try {
      const itemId = req.params.id;
      const userId = req.user.userId;
      const { inCloset, status } = req.body;
      const updatedItem = await ItemService.updateItemStatus(itemId, userId, { inCloset, status });
      return new OK({
        message: 'Cập nhật trạng thái vật phẩm thành công',
        metadata: updatedItem
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ItemController; 
