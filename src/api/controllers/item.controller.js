'use strict';

const ItemService = require('../../services/item.service');
const { OK, CREATED } = require('../../core/success.response');
const { BadRequestError, ValidationError } = require('../../core/error.response');
const logger = require('../../utils/logger');

class ItemController {
  // Tạo mới item
  static async createItem(req, res, next) {
    try {
      // Validate dữ liệu đầu vào
      const { name, category } = req.body;
      if (!name || !name.trim()) {
        throw new ValidationError('Tên vật phẩm không được để trống');
      }
      if (!category) {
        throw new ValidationError('Danh mục vật phẩm là bắt buộc');
      }

      const userId = req.user.userId;
      const itemData = { ...req.body, ownerId: userId };
      logger.info(`Creating new item: ${name}, category: ${category}, userId: ${userId}`);
      
      const newItem = await ItemService.createItem(itemData);
      
      return new CREATED({
        message: 'Tạo mới vật phẩm thành công',
        metadata: newItem
      }).send(res);
    } catch (error) {
      logger.error(`Error creating item: ${error.message}`);
      next(error);
    }
  }

  // Lấy danh sách item của người dùng
  static async getUserItems(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20, sort = 'ctime', filter, category, 
              season, color, brand, inCloset } = req.query;
      
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
      if (color) filterOptions.color = color;
      if (brand) filterOptions.brand = brand;
      if (inCloset !== undefined) filterOptions.inCloset = inCloset === 'true';
      
      if (filter) {
        try {
          const parsedFilter = JSON.parse(filter);
          Object.assign(filterOptions, parsedFilter);
        } catch (error) {
          logger.warn(`Filter parse error: ${error.message}`);
          throw new BadRequestError('Filter không đúng định dạng JSON');
        }
      }

      const items = await ItemService.findUserItems({
        userId,
        page: pageNum,
        limit: limitNum,
        sort,
        filter: filterOptions
      });

      // Thêm pagination headers
      const totalItems = items.totalDocs || 0;
      const totalPages = items.totalPages || 1;
      
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
        message: 'Lấy danh sách vật phẩm thành công',
        metadata: {
          items: items.docs || [],
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
      logger.error(`Error getting user items: ${error.message}`);
      next(error);
    }
  }

  // Lấy chi tiết item
  static async getItemById(req, res, next) {
    try {
      const itemId = req.params.id;
      
      if (!itemId || !itemId.trim()) {
        throw new ValidationError('ID vật phẩm không hợp lệ');
      }
      
      const userId = req.user.userId;
      logger.info(`Getting item details, itemId: ${itemId}, userId: ${userId}`);
      
      const item = await ItemService.findItemById(itemId, userId);
      
      return new OK({
        message: 'Lấy thông tin vật phẩm thành công',
        metadata: item
      }).send(res);
    } catch (error) {
      logger.error(`Error getting item: ${error.message}`);
      next(error);
    }
  }

  // Cập nhật item
  static async updateItem(req, res, next) {
    try {
      const itemId = req.params.id;
      
      if (!itemId || !itemId.trim()) {
        throw new ValidationError('ID vật phẩm không hợp lệ');
      }
      
      const userId = req.user.userId;
      const updateData = req.body;
      
      // Validate dữ liệu cập nhật
      if (Object.keys(updateData).length === 0) {
        throw new BadRequestError('Không có dữ liệu nào được cung cấp để cập nhật');
      }
      
      logger.info(`Updating item, itemId: ${itemId}, userId: ${userId}`);
      const updatedItem = await ItemService.updateItem(itemId, userId, updateData);
      
      return new OK({
        message: 'Cập nhật vật phẩm thành công',
        metadata: updatedItem
      }).send(res);
    } catch (error) {
      logger.error(`Error updating item: ${error.message}`);
      next(error);
    }
  }

  // Xóa item
  static async deleteItem(req, res, next) {
    try {
      const itemId = req.params.id;
      
      if (!itemId || !itemId.trim()) {
        throw new ValidationError('ID vật phẩm không hợp lệ');
      }
      
      const userId = req.user.userId;
      logger.info(`Deleting item, itemId: ${itemId}, userId: ${userId}`);
      
      const result = await ItemService.deleteItem(itemId, userId);
      
      return new OK({
        message: 'Xóa vật phẩm thành công',
        metadata: result
      }).send(res);
    } catch (error) {
      logger.error(`Error deleting item: ${error.message}`);
      next(error);
    }
  }

  // Cập nhật trạng thái item (đang trong tủ quần áo, đã bán, cho đi, v.v.)
  static async updateItemStatus(req, res, next) {
    try {
      const itemId = req.params.id;
      
      if (!itemId || !itemId.trim()) {
        throw new ValidationError('ID vật phẩm không hợp lệ');
      }
      
      const userId = req.user.userId;
      const { inCloset, status } = req.body;
      
      if (inCloset === undefined && status === undefined) {
        throw new BadRequestError('Phải cung cấp ít nhất một trong các trường: inCloset, status');
      }
      
      logger.info(`Updating item status, itemId: ${itemId}, userId: ${userId}, inCloset: ${inCloset}, status: ${status}`);
      
      const updatedItem = await ItemService.updateItemStatus(itemId, userId, { inCloset, status });
      
      return new OK({
        message: 'Cập nhật trạng thái vật phẩm thành công',
        metadata: updatedItem
      }).send(res);
    } catch (error) {
      logger.error(`Error updating item status: ${error.message}`);
      next(error);
    }
  }

  // Lấy tất cả metadata trong một lần gọi API
  static async getAllMetadata(req, res, next) {
    try {
      logger.info('Getting all item metadata');
      
      const metadata = await ItemService.getAllItemMetadata();
      
      return new OK({
        message: 'Lấy metadata thành công',
        metadata
      }).send(res);
    } catch (error) {
      logger.error(`Error getting item metadata: ${error.message}`);
      next(error);
    }
  }
}

module.exports = ItemController; 
