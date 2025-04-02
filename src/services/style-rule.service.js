'use strict';

class StyleRuleService {
  static _evaluatePatternMatching(rule, items) {
    const patterns = items.map(item => item.pattern).filter(Boolean);
    
    // Kiểm tra các điều kiện
    const matchingConditions = [];
    let totalScore = 0;
    
    for (const condition of rule.conditions) {
      // Ví dụ: không nên kết hợp quá 2 họa tiết mạnh
      if (condition.attribute === 'patternCount' && condition.operator === 'less_than') {
        const strongPatterns = patterns.filter(pattern => 
          ['plaid', 'floral', 'stripe', 'animal'].includes(pattern)
        );
        
        if (strongPatterns.length < condition.value) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
      // Kiểm tra các họa tiết không nên kết hợp với nhau
      else if (condition.attribute === 'incompatiblePatterns' && condition.operator === 'not_equals') {
        const pattern1 = condition.value[0];
        const pattern2 = condition.value[1];
        
        if (!(patterns.includes(pattern1) && patterns.includes(pattern2))) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
    }

    if (matchingConditions.length > 0) {
      return {
        ruleId: rule._id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        description: rule.description,
        matchingConditions,
        recommendations: rule.recommendations,
        score: totalScore / matchingConditions.length
      };
    }
    
    return null;
  }

  // Đánh giá tỷ lệ
  static _evaluateProportion(rule, items, userProfile) {
    if (!userProfile) return null;
    
    const matchingConditions = [];
    let totalScore = 0;
    
    // Lấy thông tin về vóc dáng người dùng
    const { bodyType, measurements } = userProfile;
    
    for (const condition of rule.conditions) {
      // Kiểm tra tỷ lệ phần trên/phần dưới (áo/quần)
      if (condition.attribute === 'topBottomRatio' && bodyType) {
        const tops = items.filter(item => ['áo', 'top', 'shirt', 'blouse', 'jacket'].includes(item.category));
        const bottoms = items.filter(item => ['quần', 'váy', 'pants', 'skirt'].includes(item.category));
        
        if (tops.length > 0 && bottoms.length > 0) {
          // Kiểm tra tỷ lệ phù hợp với loại cơ thể
          let isProportionGood = false;
          
          switch (bodyType) {
            case 'hourglass': // Tỷ lệ cân đối
              isProportionGood = true;
              break;
            case 'pear': // Nên nhấn mạnh phần trên
              isProportionGood = tops.some(top => 
                top.attributes && top.attributes.includes('voluminous')
              );
              break;
            case 'apple': // Nên nhấn mạnh phần dưới
              isProportionGood = bottoms.some(bottom => 
                bottom.attributes && bottom.attributes.includes('structured')
              );
              break;
            // Thêm các trường hợp khác
          }
          
          if (isProportionGood) {
            matchingConditions.push(condition);
            totalScore += rule.score;
          }
        }
      }
    }

    if (matchingConditions.length > 0) {
      return {
        ruleId: rule._id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        description: rule.description,
        matchingConditions,
        recommendations: rule.recommendations,
        score: totalScore / matchingConditions.length
      };
    }
    
    return null;
  }

  // Đánh giá phù hợp với dịp
  static _evaluateOccasion(rule, outfit) {
    if (!outfit.occasion) return null;
    
    const matchingConditions = [];
    let totalScore = 0;
    
    for (const condition of rule.conditions) {
      // Kiểm tra dịp
      if (condition.attribute === 'occasion' && condition.operator === 'equals') {
        if (outfit.occasion === condition.value) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
      // Kiểm tra độ trang trọng
      else if (condition.attribute === 'formalLevel' && condition.operator === 'equals') {
        const formalOccasions = ['wedding', 'formal', 'business', 'ceremony'];
        const casualOccasions = ['casual', 'daily', 'sport', 'beach'];
        
        const outfitFormalLevel = formalOccasions.includes(outfit.occasion) ? 'formal' : 
                                  casualOccasions.includes(outfit.occasion) ? 'casual' : 'semi-formal';
        
        if (outfitFormalLevel === condition.value) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
    }

    if (matchingConditions.length > 0) {
      return {
        ruleId: rule._id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        description: rule.description,
        matchingConditions,
        recommendations: rule.recommendations,
        score: totalScore / matchingConditions.length
      };
    }
    
    return null;
  }

  // Đánh giá phù hợp với dáng người
  static _evaluateBodyType(rule, items, userProfile) {
    if (!userProfile || !userProfile.bodyType) return null;
    
    const bodyType = userProfile.bodyType;
    const matchingConditions = [];
    let totalScore = 0;
    
    for (const condition of rule.conditions) {
      // Kiểm tra loại dáng người
      if (condition.attribute === 'bodyType' && condition.operator === 'equals') {
        if (bodyType === condition.value || condition.value === 'all') {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
      // Kiểm tra các loại trang phục phù hợp cho dáng người
      else if (condition.attribute === 'recommendedStyles' && condition.operator === 'contains') {
        const recommendedStyles = condition.value[bodyType] || [];
        const itemStyles = items.flatMap(item => item.style || []);
        
        const hasRecommendedStyle = recommendedStyles.some(style => itemStyles.includes(style));
        if (hasRecommendedStyle) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
    }

    if (matchingConditions.length > 0) {
      return {
        ruleId: rule._id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        description: rule.description,
        matchingConditions,
        recommendations: rule.recommendations,
        score: totalScore / matchingConditions.length
      };
    }
    
    return null;
  }

  // Đánh giá phù hợp với mùa
  static _evaluateSeason(rule, outfit) {
    const currentSeason = this._getCurrentSeason();
    const outfitSeason = outfit.season || currentSeason;
    
    const matchingConditions = [];
    let totalScore = 0;
    
    for (const condition of rule.conditions) {
      // Kiểm tra mùa
      if (condition.attribute === 'season' && condition.operator === 'equals') {
        if (outfitSeason === condition.value || condition.value === 'all' || outfitSeason === 'all') {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
      // Kiểm tra các chất liệu phù hợp cho mùa
      else if (condition.attribute === 'materials' && condition.operator === 'contains') {
        const seasonalMaterials = condition.value[outfitSeason] || [];
        // Thực hiện kiểm tra tương tự như bodyType
      }
    }

    if (matchingConditions.length > 0) {
      return {
        ruleId: rule._id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        description: rule.description,
        matchingConditions,
        recommendations: rule.recommendations,
        score: totalScore / matchingConditions.length
      };
    }
    
    return null;
  }

  // Đánh giá các quy tắc chung
  static _evaluateGeneral(rule, items, outfit) {
    const matchingConditions = [];
    let totalScore = 0;
    
    for (const condition of rule.conditions) {
      // Kiểm tra số lượng items
      if (condition.attribute === 'itemCount' && condition.operator === 'equals') {
        if (items.length === condition.value) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
      // Kiểm tra độ phong phú của tủ đồ
      else if (condition.attribute === 'versatility' && condition.operator === 'greater_than') {
        // Đánh giá dựa trên số lượng outfit có thể tạo ra từ các item
        const versatilityScore = items.reduce((score, item) => {
          return score + (item.wearCount || 0);
        }, 0) / items.length;
        
        if (versatilityScore > condition.value) {
          matchingConditions.push(condition);
          totalScore += rule.score;
        }
      }
    }

    if (matchingConditions.length > 0) {
      return {
        ruleId: rule._id,
        ruleName: rule.name,
        ruleType: rule.ruleType,
        description: rule.description,
        matchingConditions,
        recommendations: rule.recommendations,
        score: totalScore / matchingConditions.length
      };
    }
    
    return null;
  }

  // Xác định mùa hiện tại dựa trên tháng
  static _getCurrentSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter'; // 12, 1, 2
  }

  // Thêm phương thức để tạo quy tắc phong cách mới
  static async createStyleRule(ruleData) {
    try {
      // Giả định bạn có model styleRuleModel
      const styleRuleModel = require('../db/models/style-rule.model');
      const newRule = new styleRuleModel(ruleData);
      return await newRule.save();
    } catch (error) {
      throw new Error(`Lỗi khi tạo quy tắc phong cách: ${error.message}`);
    }
  }

  // Lấy danh sách quy tắc phong cách
  static async getStyleRules({ page, limit, type, userId }) {
    try {
      const styleRuleModel = require('../db/models/style-rule.model');
      
      const query = {};
      
      // Lọc theo loại quy tắc nếu có
      if (type) {
        query.ruleType = type;
      }
      
      // Lọc theo người tạo hoặc quy tắc công khai
      query.$or = [
        { createdBy: userId },
        { isPublic: true }
      ];
      
      // Thực hiện truy vấn với phân trang
      const rules = await styleRuleModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      // Đếm tổng số quy tắc
      const total = await styleRuleModel.countDocuments(query);
      
      return {
        rules,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách quy tắc phong cách: ${error.message}`);
    }
  }

  // Đánh giá trang phục theo quy tắc
  static async evaluateOutfit(outfitId, userId, ruleTypes = []) {
    try {
      // Giả định bạn có các model cần thiết
      const outfitModel = require('../db/models/outfit.model');
      const itemModel = require('../db/models/item.model');
      const userModel = require('../db/models/user.model');
      const styleRuleModel = require('../db/models/style-rule.model');
      
      // Lấy thông tin trang phục
      const outfit = await outfitModel.findOne({
        _id: outfitId,
        ownerId: userId
      });
      
      if (!outfit) {
        throw new Error('Không tìm thấy trang phục');
      }
      
      // Lấy các item trong trang phục
      const items = await itemModel.find({
        _id: { $in: outfit.items },
        ownerId: userId
      });
      
      // Lấy thông tin người dùng
      const userProfile = await userModel.findById(userId);
      
      // Lấy các quy tắc phong cách phù hợp
      const query = {
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ]
      };
      
      // Lọc theo loại quy tắc
      if (ruleTypes && ruleTypes.length > 0) {
        query.ruleType = { $in: ruleTypes };
      }
      
      const rules = await styleRuleModel.find(query);
      
      // Đánh giá trang phục theo từng quy tắc
      const evaluations = [];
      
      for (const rule of rules) {
        let evaluation = null;
        
        switch (rule.ruleType) {
          case 'pattern':
            evaluation = this._evaluatePatternMatching(rule, items);
            break;
          case 'proportion':
            evaluation = this._evaluateProportion(rule, items, userProfile);
            break;
          case 'occasion':
            evaluation = this._evaluateOccasion(rule, outfit);
            break;
          case 'bodyType':
            evaluation = this._evaluateBodyType(rule, items, userProfile);
            break;
          case 'season':
            evaluation = this._evaluateSeason(rule, outfit);
            break;
          case 'general':
          default:
            evaluation = this._evaluateGeneral(rule, items, outfit);
            break;
        }
        
        if (evaluation) {
          evaluations.push(evaluation);
        }
      }
      
      // Tính điểm tổng thể
      const overallScore = evaluations.length > 0
        ? evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length
        : 0;
      
      return {
        outfitId,
        evaluations,
        overallScore,
        passedRules: evaluations.length,
        totalRules: rules.length
      };
    } catch (error) {
      throw new Error(`Lỗi khi đánh giá trang phục: ${error.message}`);
    }
  }

  // Lấy quy tắc phong cách theo ID
  static async getStyleRuleById(id, userId) {
    try {
      const styleRuleModel = require('../db/models/style-rule.model');
      
      const rule = await styleRuleModel.findOne({
        _id: id,
        $or: [
          { createdBy: userId },
          { isPublic: true }
        ]
      });
      
      if (!rule) {
        throw new Error('Không tìm thấy quy tắc phong cách');
      }
      
      return rule;
    } catch (error) {
      throw new Error(`Lỗi khi lấy quy tắc phong cách: ${error.message}`);
    }
  }

  // Cập nhật quy tắc phong cách
  static async updateStyleRule(id, updateData, userId) {
    try {
      const styleRuleModel = require('../db/models/style-rule.model');
      
      // Kiểm tra quy tắc tồn tại và người dùng có quyền sửa
      const existingRule = await styleRuleModel.findOne({
        _id: id,
        createdBy: userId
      });
      
      if (!existingRule) {
        throw new Error('Không tìm thấy quy tắc phong cách hoặc bạn không có quyền chỉnh sửa');
      }
      
      // Cập nhật quy tắc
      const updatedRule = await styleRuleModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );
      
      return updatedRule;
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật quy tắc phong cách: ${error.message}`);
    }
  }

  // Xóa quy tắc phong cách
  static async deleteStyleRule(id, userId) {
    try {
      const styleRuleModel = require('../db/models/style-rule.model');
      
      // Kiểm tra quy tắc tồn tại và người dùng có quyền xóa
      const existingRule = await styleRuleModel.findOne({
        _id: id,
        createdBy: userId
      });
      
      if (!existingRule) {
        throw new Error('Không tìm thấy quy tắc phong cách hoặc bạn không có quyền xóa');
      }
      
      // Xóa quy tắc
      await styleRuleModel.findByIdAndDelete(id);
      
      return true;
    } catch (error) {
      throw new Error(`Lỗi khi xóa quy tắc phong cách: ${error.message}`);
    }
  }
}

module.exports = StyleRuleService; 
