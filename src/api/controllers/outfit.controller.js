'use strict';

const OutfitService = require('../../services/outfit.service');
const { OK, CREATED } = require('../../core/success.response');
const { BadRequestError, ValidationError } = require('../../core/error.response');
const logger = require('../../utils/logger');

class OutfitController {
  // Tạo mới outfit
  static async createOutfit(req, res, next) {
    try {
      // Validate dữ liệu đầu vào
      const { name } = req.body;
      if (!name || !name.trim()) {
        throw new ValidationError('Tên trang phục không được để trống');
      }

      const userId = req.user.userId;
      const outfitData = { ...req.body, ownerId: userId };
      logger.info(`Creating new outfit: ${name}, userId: ${userId}`);
      
      const newOutfit = await OutfitService.createOutfit(outfitData);
      
      return new CREATED({
        message: 'Tạo trang phục thành công',
        metadata: newOutfit
      }).send(res);
    } catch (error) {
      logger.error(`Error creating outfit: ${error.message}`);
      next(error);
    }
  }

  // Lấy danh sách outfit của người dùng
  static async getUserOutfits(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, sort = 'ctime', filter, category,
              season, occasion, styleType } = req.query;
      
      // Validate pagination params
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (isNaN(pageNum) || pageNum < 1) {
        throw new ValidationError('Page number phải là số nguyên dương');
      }
      
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new ValidationError('Limit phải là số nguyên dương và không vượt quá 100');
      }
      
      // Xây dựng filter dựa trên query parameter
      const filterOptions = { ownerId: userId };
      if (category) filterOptions.category = category;
      if (season) filterOptions.season = season;
      if (occasion) filterOptions.occasion = occasion;
      if (styleType) filterOptions.styleTypes = styleType;
      
      if (filter) {
        try {
          const parsedFilter = JSON.parse(filter);
          Object.assign(filterOptions, parsedFilter);
        } catch (error) {
          logger.warn(`Filter parse error: ${error.message}`);
          throw new BadRequestError('Filter không đúng định dạng JSON');
        }
      }

      const outfits = await OutfitService.getAllOutfits({
        ownerId: userId,
        page: pageNum,
        limit: limitNum,
        sort,
        filter: filterOptions,
        season,
        occasion
      });

      // Thêm pagination headers
      const totalItems = outfits.totalDocs || 0;
      const totalPages = outfits.totalPages || 1;
      
      res.set({
        'X-Total-Count': totalItems.toString(),
        'X-Total-Pages': totalPages.toString(),
        'X-Current-Page': pageNum.toString(),
        'X-Page-Limit': limitNum.toString()
      });
      
      // Tạo Link header cho pagination (theo chuẩn RFC 8288)
      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
      const queryParams = new URLSearchParams(req.query);
      
      const links = [];
      
      // First page
      queryParams.set('page', '1');
      links.push(`<${baseUrl}?${queryParams.toString()}>; rel="first"`);
      
      // Previous page
      if (pageNum > 1) {
        queryParams.set('page', (pageNum - 1).toString());
        links.push(`<${baseUrl}?${queryParams.toString()}>; rel="prev"`);
      }
      
      // Next page
      if (pageNum < totalPages) {
        queryParams.set('page', (pageNum + 1).toString());
        links.push(`<${baseUrl}?${queryParams.toString()}>; rel="next"`);
      }
      
      // Last page
      queryParams.set('page', totalPages.toString());
      links.push(`<${baseUrl}?${queryParams.toString()}>; rel="last"`);
      
      res.set('Link', links.join(', '));

      return new OK({
        message: 'Lấy danh sách trang phục thành công',
        metadata: {
          outfits: outfits.docs || [],
          pagination: {
            total: totalItems,
            totalPages,
            currentPage: pageNum,
            limit: limitNum,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          }
        }
      }).send(res);
    } catch (error) {
      logger.error(`Error getting user outfits: ${error.message}`);
      next(error);
    }
  }

  // Lấy chi tiết outfit
  static async getOutfitById(req, res, next) {
    try {
      const outfitId = req.params.id;
      
      if (!outfitId || !outfitId.trim()) {
        throw new ValidationError('ID trang phục không hợp lệ');
      }
      
      const userId = req.user.userId;
      logger.info(`Getting outfit details, outfitId: ${outfitId}, userId: ${userId}`);
      
      const outfit = await OutfitService.findOutfitById(outfitId, userId);
      
      return new OK({
        message: 'Lấy thông tin trang phục thành công',
        metadata: outfit
      }).send(res);
    } catch (error) {
      logger.error(`Error getting outfit: ${error.message}`);
      next(error);
    }
  }

  // Cập nhật outfit
  static async updateOutfit(req, res, next) {
    try {
      const outfitId = req.params.id;
      
      if (!outfitId || !outfitId.trim()) {
        throw new ValidationError('ID trang phục không hợp lệ');
      }
      
      const userId = req.user.userId;
      const updateData = req.body;
      
      // Validate dữ liệu cập nhật
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('Không có dữ liệu nào được cung cấp để cập nhật');
      }
      
      logger.info(`Updating outfit, outfitId: ${outfitId}, userId: ${userId}`);
      const updatedOutfit = await OutfitService.updateOutfit(outfitId, userId, updateData);
      
      return new OK({
        message: 'Cập nhật trang phục thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      logger.error(`Error updating outfit: ${error.message}`);
      next(error);
    }
  }

  // Xóa outfit
  static async deleteOutfit(req, res, next) {
    try {
      const outfitId = req.params.id;
      
      if (!outfitId || !outfitId.trim()) {
        throw new ValidationError('ID trang phục không hợp lệ');
      }
      
      const userId = req.user.userId;
      logger.info(`Deleting outfit, outfitId: ${outfitId}, userId: ${userId}`);
      
      const result = await OutfitService.deleteOutfit(outfitId, userId);
      
      return new OK({
        message: 'Xóa trang phục thành công',
        metadata: result
      }).send(res);
    } catch (error) {
      logger.error(`Error deleting outfit: ${error.message}`);
      next(error);
    }
  }

  // Đánh dấu outfit đã mặc
  static async markOutfitAsWorn(req, res, next) {
    try {
      const outfitId = req.params.id;
      
      if (!outfitId || !outfitId.trim()) {
        throw new ValidationError('ID trang phục không hợp lệ');
      }
      
      const userId = req.user.userId;
      const { date, event, notes } = req.body;
      
      // Validate date nếu được cung cấp
      if (date && isNaN(new Date(date).getTime())) {
        throw new ValidationError('Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng ISO (YYYY-MM-DD)');
      }
      
      logger.info(`Marking outfit as worn, outfitId: ${outfitId}, userId: ${userId}, date: ${date}, event: ${event}`);
      
      const updatedOutfit = await OutfitService.markAsWorn(outfitId, userId, { date, event, notes });
      
      return new OK({
        message: 'Đánh dấu trang phục đã mặc thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      logger.error(`Error marking outfit as worn: ${error.message}`);
      next(error);
    }
  }

  // Thêm item vào outfit
  static async addItemToOutfit(req, res, next) {
    try {
      const outfitId = req.params.id;
      
      if (!outfitId || !outfitId.trim()) {
        throw new ValidationError('ID trang phục không hợp lệ');
      }
      
      const userId = req.user.userId;
      const { itemId, position } = req.body;
      
      if (!itemId || !itemId.trim()) {
        throw new ValidationError('ID vật phẩm không hợp lệ');
      }
      
      if (!position) {
        throw new ValidationError('Vị trí trong trang phục (position) là bắt buộc');
      }
      
      logger.info(`Adding item to outfit, outfitId: ${outfitId}, itemId: ${itemId}, position: ${position}, userId: ${userId}`);
      
      const updatedOutfit = await OutfitService.addItemToOutfit(outfitId, userId, itemId, position);
      
      return new OK({
        message: 'Thêm vật phẩm vào trang phục thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      logger.error(`Error adding item to outfit: ${error.message}`);
      next(error);
    }
  }

  // Xóa item khỏi outfit
  static async removeItemFromOutfit(req, res, next) {
    try {
      const outfitId = req.params.outfitId;
      const itemId = req.params.itemId;
      
      if (!outfitId || !outfitId.trim()) {
        throw new ValidationError('ID trang phục không hợp lệ');
      }
      
      if (!itemId || !itemId.trim()) {
        throw new ValidationError('ID vật phẩm không hợp lệ');
      }
      
      const userId = req.user.userId;
      logger.info(`Removing item from outfit, outfitId: ${outfitId}, itemId: ${itemId}, userId: ${userId}`);
      
      const updatedOutfit = await OutfitService.removeItemFromOutfit(outfitId, userId, itemId);
      
      return new OK({
        message: 'Xóa vật phẩm khỏi trang phục thành công',
        metadata: updatedOutfit
      }).send(res);
    } catch (error) {
      logger.error(`Error removing item from outfit: ${error.message}`);
      next(error);
    }
  }

  // Tạo gợi ý trang phục dựa trên các tiêu chí
  static async getOutfitRecommendations(req, res, next) {
    try {
      const userId = req.user.userId;
      const { occasion, weather, season, color, styleType, limit = 5 } = req.query;
      
      // Validate limit
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
        throw new ValidationError('Limit phải là số nguyên dương và không vượt quá 20');
      }
      
      logger.info(`Getting outfit recommendations, userId: ${userId}, occasion: ${occasion}, weather: ${weather}`);
      
      const recommendations = await OutfitService.generateOutfitRecommendations({
        userId,
        criteria: {
          occasion,
          weather,
          season,
          color,
          styleType
        },
        limit: limitNum
      });
      
      return new OK({
        message: 'Lấy gợi ý trang phục thành công',
        metadata: recommendations
      }).send(res);
    } catch (error) {
      logger.error(`Error getting outfit recommendations: ${error.message}`);
      next(error);
    }
  }

  // Lấy thống kê về trang phục
  static async getOutfitStatistics(req, res, next) {
    try {
      const userId = req.user.userId;
      const { period = 'month' } = req.query;
      
      // Validate period
      const validPeriods = ['week', 'month', 'year', 'all'];
      if (!validPeriods.includes(period)) {
        throw new ValidationError('Period không hợp lệ. Giá trị hợp lệ: week, month, year, all');
      }
      
      logger.info(`Getting outfit statistics, userId: ${userId}, period: ${period}`);
      
      const statistics = await OutfitService.getOutfitStatistics(userId, period);
      
      return new OK({
        message: 'Lấy thống kê trang phục thành công',
        metadata: statistics
      }).send(res);
    } catch (error) {
      logger.error(`Error getting outfit statistics: ${error.message}`);
      next(error);
    }
  }
  
  // Lấy outfits phù hợp với thời tiết
  static async getOutfitsForWeather(req, res, next) {
    try {
      const userId = req.user.userId;
      const { temperature, weatherCondition, limit = 5 } = req.query;
      
      // Validate parameters
      if (!temperature && !weatherCondition) {
        throw new ValidationError('Phải cung cấp ít nhất một trong các tiêu chí: temperature, weatherCondition');
      }
      
      // Validate limit
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
        throw new ValidationError('Limit phải là số nguyên dương và không vượt quá 20');
      }
      
      logger.info(`Getting weather-appropriate outfits, userId: ${userId}, temperature: ${temperature}, condition: ${weatherCondition}`);
      
      const outfits = await OutfitService.findOutfitsForWeather(userId, {
        temperature: temperature ? parseFloat(temperature) : undefined,
        condition: weatherCondition,
        limit: limitNum
      });
      
      return new OK({
        message: 'Lấy trang phục phù hợp thời tiết thành công',
        metadata: outfits
      }).send(res);
    } catch (error) {
      logger.error(`Error getting outfits for weather: ${error.message}`);
      next(error);
    }
  }
}

module.exports = OutfitController; 
