'use strict';

const OutfitService = require('../services/outfit.service');
const { OK, CREATED } = require('../core/success.response');

class OutfitController {
  // Tạo mới outfit
  static async createOutfit(req, res, next) {
    try {
      const userId = req.user.userId;
      const outfitData = { ...req.body, ownerId: userId };
      const newOutfit = await OutfitService.createOutfit(outfitData);
      return new CREATED({
        message: 'Tạo trang phục thành công',
        metadata: newOutfit
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách outfit của người dùng
  static async getUserOutfits(req, res, next) {
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

      const outfits = await OutfitService.findUserOutfits({
        userId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort: sort || 'ctime',
        filter: filterOptions
      });

      return new OK({
        message: 'Lấy danh sách trang phục thành công',
        metadata: outfits
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy chi tiết outfit
  static async getOutfitById(req, res, next) {
    try {
      const outfitId = req.params.id;
      const userId = req.user.userId;
      const outfit = await OutfitService.findOutfitById(outfitId, userId);
      return new OK({
        message: 'Lấy thông tin trang phục thành công',
        metadata: outfit
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật outfit
  static async updateOutfit(req, res, next) {
    try {
      const outfitId = req.params.id;
      const userId = req.user.userId;
      const updateData = req.body;
      const updatedOutfit = await OutfitService.updateOutfit(outfitId, userId, updateData);
      return new OK({
        message: 'Cập nhật trang phục thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Xóa outfit
  static async deleteOutfit(req, res, next) {
    try {
      const outfitId = req.params.id;
      const userId = req.user.userId;
      const result = await OutfitService.deleteOutfit(outfitId, userId);
      return new OK({
        message: 'Xóa trang phục thành công',
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Đánh dấu outfit đã mặc
  static async markOutfitAsWorn(req, res, next) {
    try {
      const outfitId = req.params.id;
      const userId = req.user.userId;
      const { date, event } = req.body;
      const updatedOutfit = await OutfitService.markAsWorn(outfitId, userId, { date, event });
      return new OK({
        message: 'Đánh dấu trang phục đã mặc thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Thêm item vào outfit
  static async addItemToOutfit(req, res, next) {
    try {
      const outfitId = req.params.id;
      const userId = req.user.userId;
      const { itemId, position } = req.body;
      const updatedOutfit = await OutfitService.addItemToOutfit(outfitId, userId, itemId, position);
      return new OK({
        message: 'Thêm vật phẩm vào trang phục thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Xóa item khỏi outfit
  static async removeItemFromOutfit(req, res, next) {
    try {
      const outfitId = req.params.outfitId;
      const itemId = req.params.itemId;
      const userId = req.user.userId;
      const updatedOutfit = await OutfitService.removeItemFromOutfit(outfitId, userId, itemId);
      return new OK({
        message: 'Xóa vật phẩm khỏi trang phục thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = OutfitController; 