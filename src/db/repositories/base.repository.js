'use strict';

/**
 * Base Repository là lớp trừu tượng (abstract class) cung cấp các phương thức CRUD cơ bản
 * và các phương thức truy vấn thông dụng cho các repositories khác kế thừa
 */
class BaseRepository {
  /**
   * Khởi tạo repository với model
   * @param {Model} model - Mongoose model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Tạo mới một document
   * @param {Object} data - Dữ liệu cần tạo mới
   * @returns {Promise<Document>} Document đã tạo
   */
  async create(data) {
    return await this.model.create(data);
  }

  /**
   * Tìm document theo id
   * @param {string|ObjectId} id - Id của document
   * @param {Object} options - Các tùy chọn bổ sung
   * @param {string|Object} options.select - Các trường cần chọn
   * @param {string|Object} options.populate - Các trường cần populate
   * @returns {Promise<Document|null>} Document nếu tìm thấy, null nếu không
   */
  async findById(id, options = {}) {
    let query = this.model.findById(id);
    
    if (options.select) {
      query = query.select(options.select);
    }
    
    if (options.populate) {
      query = query.populate(options.populate);
    }
    
    return await query.exec();
  }

  /**
   * Tìm một document theo điều kiện
   * @param {Object} filter - Điều kiện lọc
   * @param {Object} options - Các tùy chọn bổ sung
   * @param {string|Object} options.select - Các trường cần chọn
   * @param {string|Object} options.populate - Các trường cần populate
   * @returns {Promise<Document|null>} Document nếu tìm thấy, null nếu không
   */
  async findOne(filter, options = {}) {
    let query = this.model.findOne(filter);
    
    if (options.select) {
      query = query.select(options.select);
    }
    
    if (options.populate) {
      query = query.populate(options.populate);
    }
    
    return await query.exec();
  }

  /**
   * Tìm nhiều documents theo điều kiện với phân trang và sắp xếp
   * @param {Object} params - Các tham số truy vấn
   * @param {Object} params.filter - Điều kiện lọc
   * @param {number} params.page - Trang hiện tại (bắt đầu từ 1)
   * @param {number} params.limit - Số lượng documents trên mỗi trang
   * @param {Object|string} params.sort - Điều kiện sắp xếp
   * @param {string|Object} params.select - Các trường cần chọn
   * @param {string|Object} params.populate - Các trường cần populate
   * @returns {Promise<Object>} Đối tượng chứa documents và thông tin phân trang
   */
  async findMany({ filter = {}, page = 1, limit = 20, sort = { createdAt: -1 }, select, populate }) {
    // Chuyển đổi page thành số nguyên
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    // Đếm tổng số documents
    const totalItems = await this.model.countDocuments(filter);
    
    // Xây dựng query
    let query = this.model.find(filter);
    
    if (select) {
      query = query.select(select);
    }
    
    if (sort) {
      query = query.sort(sort);
    }
    
    if (populate) {
      query = query.populate(populate);
    }
    
    // Thực hiện phân trang
    const items = await query
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .exec();
    
    return {
      items,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNumber)
      }
    };
  }

  /**
   * Cập nhật một document theo id
   * @param {string|ObjectId} id - Id của document
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @param {Object} options - Các tùy chọn bổ sung
   * @param {boolean} options.new - Trả về document sau khi cập nhật (mặc định: true)
   * @param {boolean} options.runValidators - Chạy validators (mặc định: true)
   * @returns {Promise<Document|null>} Document đã cập nhật hoặc null nếu không tìm thấy
   */
  async updateById(id, updateData, options = { new: true, runValidators: true }) {
    return await this.model.findByIdAndUpdate(id, updateData, options);
  }

  /**
   * Cập nhật nhiều documents theo điều kiện
   * @param {Object} filter - Điều kiện lọc
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} Kết quả cập nhật
   */
  async updateMany(filter, updateData) {
    return await this.model.updateMany(filter, updateData);
  }

  /**
   * Xóa một document theo id
   * @param {string|ObjectId} id - Id của document
   * @returns {Promise<Document|null>} Document đã xóa hoặc null nếu không tìm thấy
   */
  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  /**
   * Xóa nhiều documents theo điều kiện
   * @param {Object} filter - Điều kiện lọc
   * @returns {Promise<Object>} Kết quả xóa
   */
  async deleteMany(filter) {
    return await this.model.deleteMany(filter);
  }

  /**
   * Kiểm tra document tồn tại theo điều kiện
   * @param {Object} filter - Điều kiện lọc
   * @returns {Promise<boolean>} true nếu tồn tại, false nếu không
   */
  async exists(filter) {
    const result = await this.model.exists(filter);
    return !!result;
  }

  /**
   * Đếm số lượng documents theo điều kiện
   * @param {Object} filter - Điều kiện lọc
   * @returns {Promise<number>} Số lượng documents
   */
  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }
}

module.exports = BaseRepository; 