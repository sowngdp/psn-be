'use strict';

const styleRuleModel = require('../models/models/StyleRule');
const outfitModel = require('../models/models/Outfit');
const itemModel = require('../models/models/Item');
const userStyleProfileModel = require('../models/models/UserStyleProfile');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const { Types } = require('mongoose');

class StyleRuleService {
  // Lấy tất cả quy tắc phong cách
  static async getAllStyleRules({ ruleType, isActive, userId }) {
    const filter = {};
    
    if (ruleType) {
      filter.ruleType = ruleType;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    
    // Chỉ lấy quy tắc công khai hoặc do người dùng tạo
    filter.$or = [
      { isPublic: true },
      { createdBy: userId }
    ];
    
    const styleRules = await styleRuleModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    
    return styleRules;
  }
  
  // Lấy quy tắc phong cách theo ID
  static async getStyleRuleById(ruleId, userId) {
    const styleRule = await styleRuleModel.findOne({
      _id: ruleId,
      $or: [
        { isPublic: true },
        { createdBy: userId }
      ]
    }).lean();
    
    if (!styleRule) {
      throw new NotFoundError('Không tìm thấy quy tắc phong cách');
    }
    
    return styleRule;
  }
  
  // Tạo quy tắc phong cách mới
  static async createStyleRule(ruleData) {
    // Validate dữ liệu
    if (!ruleData.name || !ruleData.ruleType) {
      throw new BadRequestError('Tên và loại quy tắc là bắt buộc');
    }
    
    const newRule = await styleRuleModel.create({
      ...ruleData,
      isActive: true,
      isPublic: ruleData.isPublic || false
    });
    
    return newRule;
  }
  
  // Cập nhật quy tắc phong cách
  static async updateStyleRule(ruleId, userId, updateData) {
    // Kiểm tra quy tắc tồn tại và thuộc về người dùng
    const styleRule = await styleRuleModel.findOne({
      _id: ruleId
    });
    
    if (!styleRule) {
      throw new NotFoundError('Không tìm thấy quy tắc phong cách');
    }
    
    // Chỉ cho phép người tạo cập nhật quy tắc
    if (styleRule.createdBy.toString() !== userId && !styleRule.isPublic) {
      throw new ForbiddenError('Bạn không có quyền cập nhật quy tắc này');
    }
    
    const updatedRule = await styleRuleModel.findByIdAndUpdate(
      ruleId,
      { $set: updateData },
      { new: true }
    );
    
    return updatedRule;
  }
  
  // Xóa quy tắc phong cách
  static async deleteStyleRule(ruleId, userId) {
    // Kiểm tra quy tắc tồn tại và thuộc về người dùng
    const styleRule = await styleRuleModel.findOne({
      _id: ruleId
    });
    
    if (!styleRule) {
      throw new NotFoundError('Không tìm thấy quy tắc phong cách');
    }
    
    // Chỉ cho phép người tạo xóa quy tắc
    if (styleRule.createdBy.toString() !== userId) {
      throw new ForbiddenError('Bạn không có quyền xóa quy tắc này');
    }
    
    await styleRuleModel.findByIdAndDelete(ruleId);
    return true;
  }
  
  // Đánh giá trang phục theo quy tắc
  static async evaluateOutfit(outfitId, userId, ruleTypes = []) {
    // Kiểm tra outfit tồn tại và thuộc về người dùng
    const outfit = await outfitModel.findOne({
      _id: outfitId,
      ownerId: userId
    }).populate('items.itemId');
    
    if (!outfit) {
      throw new NotFoundError('Không tìm thấy trang phục hoặc không có quyền truy cập');
    }
    
    // Lấy thông tin profile người dùng
    const userProfile = await userStyleProfileModel.findOne({ userId });
    
    // Xây dựng filter để lấy các quy tắc phù hợp
    const filter = {
      isActive: true,
      $or: [
        { isPublic: true },
        { createdBy: userId }
      ]
    };
    
    // Nếu có chỉ định ruleTypes, thì lọc theo các loại đó
    if (ruleTypes && ruleTypes.length > 0) {
      filter.ruleType = { $in: ruleTypes };
    }
    
    // Lấy các quy tắc phong cách
    const styleRules = await styleRuleModel.find(filter);
    
    // Các items trong outfit
    const items = outfit.items.map(item => item.itemId);
    
    // Đánh giá outfit dựa trên các quy tắc
    const evaluations = [];
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const rule of styleRules) {
      // Tùy theo loại quy tắc, áp dụng logic đánh giá khác nhau
      let evaluation = null;
      
      switch (rule.ruleType) {
        case 'color_combination':
          evaluation = this._evaluateColorCombination(rule, items);
          break;
        case 'pattern_matching':
          evaluation = this._evaluatePatternMatching(rule, items);
          break;
        case 'proportion':
          evaluation = this._evaluateProportion(rule, items);
          break;
        case 'occasion':
          evaluation = this._evaluateOccasion(rule, outfit);
          break;
        case 'body_type':
          evaluation = this._evaluateBodyType(rule, items, userProfile);
          break;
        case 'season':
          evaluation = this._evaluateSeason(rule, outfit);
          break;
        case 'general':
          evaluation = this._evaluateGeneral(rule, items);
          break;
        default:
          // Quy tắc không được hỗ trợ
          continue;
      }
      
      if (evaluation) {
        evaluations.push(evaluation);
        totalScore += evaluation.score * (rule.weight || 1);
        totalWeight += (rule.weight || 1);
      }
    }
    
    // Tính điểm trung bình
    const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Đưa ra đánh giá tổng thể và gợi ý
    const suggestions = this._generateSuggestions(evaluations, outfit, items);
    
    return {
      outfitId,
      overallScore,
      evaluations,
      suggestions
    };
  }
  
  // Đánh giá tổ hợp màu sắc
  static _evaluateColorCombination(rule, items) {
    // Placeholder - Cần triển khai logic đánh giá màu sắc
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      score: 0.8,
      details: 'Tổ hợp màu sắc phù hợp'
    };
  }
  
  // Đánh giá kết hợp họa tiết
  static _evaluatePatternMatching(rule, items) {
    // Placeholder - Cần triển khai logic đánh giá họa tiết
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      score: 0.7,
      details: 'Họa tiết kết hợp khá hài hòa'
    };
  }
  
  // Đánh giá tỷ lệ cơ thể
  static _evaluateProportion(rule, items) {
    // Placeholder - Cần triển khai logic đánh giá tỷ lệ
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      score: 0.75,
      details: 'Tỷ lệ trang phục cân đối'
    };
  }
  
  // Đánh giá phù hợp với dịp
  static _evaluateOccasion(rule, outfit) {
    // Placeholder - Cần triển khai logic đánh giá phù hợp dịp
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      score: 0.85,
      details: 'Trang phục phù hợp với dịp'
    };
  }
  
  // Đánh giá phù hợp với dáng người
  static _evaluateBodyType(rule, items, userProfile) {
    // Placeholder - Cần triển khai logic đánh giá phù hợp dáng người
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      score: 0.8,
      details: 'Trang phục phù hợp với dáng người của bạn'
    };
  }
  
  // Đánh giá phù hợp với mùa
  static _evaluateSeason(rule, outfit) {
    // Placeholder - Cần triển khai logic đánh giá phù hợp mùa
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      score: 0.9,
      details: 'Trang phục rất phù hợp với mùa hiện tại'
    };
  }
  
  // Đánh giá chung
  static _evaluateGeneral(rule, items) {
    // Placeholder - Cần triển khai logic đánh giá chung
    return {
      ruleId: rule._id,
      ruleName: rule.name,
      ruleType: rule.ruleType,
      description: rule.description,
      score: 0.75,
      details: 'Đánh giá chung tốt'
    };
  }
  
  // Tạo gợi ý cải thiện
  static _generateSuggestions(evaluations, outfit, items) {
    // Placeholder - Cần triển khai logic tạo gợi ý
    const suggestions = [];
    
    // Thêm một số gợi ý mẫu
    suggestions.push({
      type: 'replace_item',
      itemId: items[0]._id,
      suggestion: 'Thử thay thế bằng một item có màu sáng hơn để tạo điểm nhấn',
      reason: 'Cải thiện tổng thể màu sắc'
    });
    
    suggestions.push({
      type: 'add_item',
      category: 'accessory',
      suggestion: 'Thêm một phụ kiện như vòng cổ hoặc mũ',
      reason: 'Làm outfit hoàn thiện hơn'
    });
    
    return suggestions;
  }

  // Xác định mùa hiện tại dựa trên tháng  
  static _getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter'; // 12, 1, 2
  }
}

module.exports = StyleRuleService; 