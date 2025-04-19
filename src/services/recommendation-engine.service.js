'use strict';

const outfitModel = require('../db/models/outfit.model');
const itemModel = require('../db/models/item.model');
const styleRuleModel = require('../db/models/style-rule.model');
const userModel = require('../db/models/user.model');
const StyleRuleService = require('./style-rule.service');
const { BadRequestError } = require('../core/error.response');

class RecommendationEngineService {
  /**
   * Xếp hạng outfit dựa trên nhiều yếu tố
   * @param {Array} outfits - Danh sách các outfit
   * @param {Object} context - Ngữ cảnh đề xuất
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Array>} Danh sách outfit đã xếp hạng
   */
  static async rankOutfits(outfits, context, userId) {
    if (!outfits || outfits.length === 0) {
      return [];
    }
    
    const scoredOutfits = await Promise.all(outfits.map(async outfit => {
      // 1. Điểm cơ bản từ outfit
      let baseScore = outfit.styleScore || 0.5;
      
      // 2. Đánh giá theo style rules nếu có
      let styleRuleScore = 0.5;
      try {
        const evaluation = await StyleRuleService.evaluateOutfit(outfit._id, userId);
        styleRuleScore = evaluation.overallScore;
      } catch (error) {
        console.error('Error evaluating outfit with style rules:', error);
      }
      
      // 3. Tính điểm dựa trên weather match
      const weatherMatchScore = this._calculateWeatherMatchScore(outfit, context.weather);
      
      // 4. Tính điểm dựa trên occasion match
      const occasionMatchScore = this._calculateOccasionMatchScore(outfit, context.occasion);
      
      // 5. Tính điểm dựa trên season match
      const seasonMatchScore = this._calculateSeasonMatchScore(outfit, context.season);
      
      // 6. Tính điểm dựa trên user preferences
      const preferencesScore = await this._calculatePreferencesMatchScore(outfit, context.userPreferences, userId);
      
      // 7. Tính điểm dựa trên lịch sử sử dụng
      const usageHistoryScore = this._calculateUsageHistoryScore(outfit);
      
      // 8. Tổng hợp điểm số với trọng số
      const finalScore = this._calculateWeightedScore({
        baseScore,
        styleRuleScore,
        weatherMatchScore,
        occasionMatchScore,
        seasonMatchScore,
        preferencesScore,
        usageHistoryScore
      });
      
      // 9. Xác định lý do đề xuất
      const reasons = this._generateReasonDescription({
        outfit,
        weatherMatchScore,
        occasionMatchScore,
        seasonMatchScore,
        preferencesScore,
        context
      });
      
      return {
        outfitId: outfit._id,
        outfit,
        score: finalScore,
        reasons
      };
    }));
    
    // Sắp xếp theo điểm số từ cao xuống thấp
    return scoredOutfits.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Xếp hạng item dựa trên nhiều yếu tố
   * @param {Array} items - Danh sách các item
   * @param {Object} context - Ngữ cảnh đề xuất
   * @param {string} userId - ID của người dùng
   * @returns {Promise<Array>} Danh sách item đã xếp hạng
   */
  static async rankItems(items, context, userId) {
    if (!items || items.length === 0) {
      return [];
    }
    
    const scoredItems = await Promise.all(items.map(async item => {
      // 1. Điểm cơ bản
      let baseScore = 0.5;
      
      // 2. Tính điểm dựa trên weather match
      const weatherMatchScore = this._calculateItemWeatherMatchScore(item, context.weather);
      
      // 3. Tính điểm dựa trên occasion match
      const occasionMatchScore = this._calculateItemOccasionMatchScore(item, context.occasion);
      
      // 4. Tính điểm dựa trên season match
      const seasonMatchScore = this._calculateItemSeasonMatchScore(item, context.season);
      
      // 5. Tính điểm dựa trên user preferences
      const preferencesScore = this._calculateItemPreferencesMatchScore(item, context.userPreferences);
      
      // 6. Tổng hợp điểm số với trọng số
      const finalScore = this._calculateWeightedScore({
        baseScore,
        weatherMatchScore,
        occasionMatchScore,
        seasonMatchScore,
        preferencesScore,
        usageHistoryScore: 0.5
      });
      
      // 7. Xác định lý do đề xuất
      const reasons = [];
      if (weatherMatchScore > 0.7) reasons.push(`Phù hợp với thời tiết ${context.weather.temperature}°C, ${context.weather.condition}`);
      if (occasionMatchScore > 0.7) reasons.push(`Phù hợp với dịp ${context.occasion}`);
      if (seasonMatchScore > 0.7) reasons.push(`Phù hợp với mùa ${context.season}`);
      if (preferencesScore > 0.7) reasons.push('Phù hợp với sở thích của bạn');
      
      return {
        itemId: item._id,
        item,
        score: finalScore,
        reasons: reasons.length > 0 ? reasons : ['Item phù hợp với ngữ cảnh hiện tại']
      };
    }));
    
    // Sắp xếp theo điểm số từ cao xuống thấp
    return scoredItems.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Lấy outfit đề xuất cho ngày hiện tại
   * @param {string} userId - ID của người dùng
   * @param {Object} context - Ngữ cảnh đề xuất
   * @param {number} limit - Số lượng đề xuất tối đa
   * @returns {Promise<Array>} Danh sách outfit đề xuất
   */
  static async getOutfitRecommendationsForToday(userId, context, limit = 5) {
    try {
      // 1. Lấy tất cả outfit hiện có
      const userOutfits = await outfitModel.find({
        ownerId: userId,
        inCloset: true
      }).limit(20);
      
      if (!userOutfits.length) {
        return [];
      }
      
      // 2. Xếp hạng outfit
      const rankedOutfits = await this.rankOutfits(userOutfits, context, userId);
      
      // 3. Trả về các outfit tốt nhất
      return rankedOutfits.slice(0, limit);
    } catch (error) {
      throw new BadRequestError(`Lỗi khi lấy đề xuất: ${error.message}`);
    }
  }
  
  /**
   * Lấy outfit đề xuất cho một dịp cụ thể
   * @param {string} userId - ID của người dùng
   * @param {string} occasion - Dịp/sự kiện
   * @param {Object} additionalContext - Ngữ cảnh bổ sung
   * @param {number} limit - Số lượng đề xuất tối đa
   * @returns {Promise<Array>} Danh sách outfit đề xuất
   */
  static async getOutfitRecommendationsForEvent(userId, occasion, additionalContext = {}, limit = 5) {
    try {
      // 1. Tìm các outfit phù hợp với dịp trực tiếp
      let outfits = await outfitModel.find({
        ownerId: userId,
        occasion: { $regex: new RegExp(occasion, 'i') },
        inCloset: true
      }).limit(20);
      
      const context = {
        ...additionalContext,
        occasion
      };
      
      // 2. Nếu không đủ outfit, tìm thêm các outfit khác
      if (outfits.length < 3) {
        const additionalOutfits = await outfitModel.find({
          ownerId: userId,
          inCloset: true,
          _id: { $nin: outfits.map(o => o._id) }
        }).limit(10);
        
        outfits = [...outfits, ...additionalOutfits];
      }
      
      // 3. Xếp hạng outfit
      const rankedOutfits = await this.rankOutfits(outfits, context, userId);
      
      // 4. Trả về các outfit tốt nhất
      return rankedOutfits.slice(0, limit);
    } catch (error) {
      throw new BadRequestError(`Lỗi khi lấy đề xuất cho sự kiện: ${error.message}`);
    }
  }
  
  /**
   * Đề xuất item để tạo thành một outfit hoàn chỉnh
   * @param {string} userId - ID của người dùng
   * @param {Array} existingItems - Danh sách item đã có
   * @param {Object} context - Ngữ cảnh đề xuất
   * @param {number} limit - Số lượng đề xuất tối đa
   * @returns {Promise<Array>} Danh sách item đề xuất
   */
  static async getItemRecommendationsForOutfit(userId, existingItems, context, limit = 5) {
    try {
      // 1. Xác định các loại item đã có
      const existingCategories = existingItems.map(item => item.category);
      
      // 2. Tìm các item bổ sung
      const complementaryItems = await itemModel.find({
        ownerId: userId,
        inCloset: true,
        _id: { $nin: existingItems.map(i => i._id) },
        category: { $nin: existingCategories }
      }).limit(20);
      
      // 3. Xếp hạng các item
      const rankedItems = await this.rankItems(complementaryItems, context, userId);
      
      // 4. Trả về các item tốt nhất
      return rankedItems.slice(0, limit);
    } catch (error) {
      throw new BadRequestError(`Lỗi khi lấy đề xuất item: ${error.message}`);
    }
  }
  
  // HELPER METHODS
  
  /**
   * Tính điểm trung bình có trọng số
   * @private
   */
  static _calculateWeightedScore(scores) {
    const weights = {
      baseScore: 0.1,
      styleRuleScore: 0.2,
      weatherMatchScore: 0.2,
      occasionMatchScore: 0.2,
      seasonMatchScore: 0.1,
      preferencesScore: 0.15,
      usageHistoryScore: 0.05
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [key, value] of Object.entries(scores)) {
      if (value !== undefined && weights[key] !== undefined) {
        totalScore += value * weights[key];
        totalWeight += weights[key];
      }
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0.5;
  }
  
  /**
   * Tính điểm phù hợp với thời tiết
   * @private
   */
  static _calculateWeatherMatchScore(outfit, weather) {
    if (!weather || !outfit) return 0.5;
    
    let score = 0.5;
    
    // Kiểm tra nhiệt độ
    if (weather.temperature !== undefined) {
      if (outfit.season === 'winter' && weather.temperature < 10) score += 0.25;
      else if (outfit.season === 'fall' && weather.temperature >= 10 && weather.temperature < 20) score += 0.25;
      else if (outfit.season === 'spring' && weather.temperature >= 15 && weather.temperature < 25) score += 0.25;
      else if (outfit.season === 'summer' && weather.temperature >= 25) score += 0.25;
      else if (outfit.season === 'all') score += 0.15;
      else score -= 0.15;
    }
    
    // Kiểm tra tags
    if (weather.weatherTags && outfit.tags) {
      const matchingTags = weather.weatherTags.filter(tag => outfit.tags.includes(tag));
      score += 0.05 * matchingTags.length;
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm phù hợp với dịp/sự kiện
   * @private
   */
  static _calculateOccasionMatchScore(outfit, occasion) {
    if (!occasion || !outfit) return 0.5;
    
    let score = 0.5;
    
    // Kiểm tra occasion match chính xác
    if (outfit.occasion && outfit.occasion.toLowerCase() === occasion.toLowerCase()) {
      score += 0.4;
    }
    // Kiểm tra occasion match một phần
    else if (outfit.occasion && outfit.occasion.toLowerCase().includes(occasion.toLowerCase())) {
      score += 0.2;
    }
    // Kiểm tra occasion match một phần
    else if (occasion && outfit.occasion && occasion.toLowerCase().includes(outfit.occasion.toLowerCase())) {
      score += 0.1;
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm phù hợp với mùa
   * @private
   */
  static _calculateSeasonMatchScore(outfit, season) {
    if (!season || !outfit) return 0.5;
    
    let score = 0.5;
    
    // Kiểm tra season match chính xác
    if (outfit.season && outfit.season.toLowerCase() === season.toLowerCase()) {
      score += 0.4;
    }
    // Outfit phù hợp với mọi mùa
    else if (outfit.season && outfit.season.toLowerCase() === 'all') {
      score += 0.3;
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm phù hợp với preferences của người dùng
   * @private
   */
  static async _calculatePreferencesMatchScore(outfit, preferences, userId) {
    if (!preferences || !outfit) return 0.5;
    
    let score = 0.5;
    const outfitItems = await itemModel.find({ _id: { $in: outfit.items } });
    
    // Kiểm tra favorite colors
    if (preferences.favoriteColors && preferences.favoriteColors.length > 0) {
      const outfitColors = outfitItems.map(item => item.color);
      const matchingColors = preferences.favoriteColors.filter(color => 
        outfitColors.some(outfitColor => outfitColor.toLowerCase().includes(color.toLowerCase()))
      );
      
      score += 0.05 * matchingColors.length;
    }
    
    // Kiểm tra favorite styles
    if (preferences.favoriteStyles && preferences.favoriteStyles.length > 0) {
      const matchingStyles = preferences.favoriteStyles.filter(style => 
        outfit.tags && outfit.tags.some(tag => tag.toLowerCase().includes(style.toLowerCase()))
      );
      
      score += 0.05 * matchingStyles.length;
    }
    
    // Kiểm tra disliked colors
    if (preferences.dislikedColors && preferences.dislikedColors.length > 0) {
      const outfitColors = outfitItems.map(item => item.color);
      const matchingDislikedColors = preferences.dislikedColors.filter(color => 
        outfitColors.some(outfitColor => outfitColor.toLowerCase().includes(color.toLowerCase()))
      );
      
      score -= 0.1 * matchingDislikedColors.length;
    }
    
    // Kiểm tra weather preferences
    if (preferences.weatherPreferences) {
      if (preferences.weatherPreferences.preferLayeredOutfits && 
          outfit.tags && outfit.tags.includes('layered')) {
        score += 0.1;
      }
      
      if (preferences.weatherPreferences.preferWarmOutfits && 
          outfit.tags && outfit.tags.includes('warm')) {
        score += 0.1;
      }
      
      if (preferences.weatherPreferences.preferBreathableOutfits && 
          outfit.tags && outfit.tags.includes('breathable')) {
        score += 0.1;
      }
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm dựa trên lịch sử sử dụng
   * @private
   */
  static _calculateUsageHistoryScore(outfit) {
    if (!outfit) return 0.5;
    
    let score = 0.5;
    
    // Ưu tiên outfit chưa được mặc gần đây
    if (!outfit.lastWorn) {
      score += 0.3; // Chưa từng mặc
    } else {
      const daysSinceLastWorn = Math.floor((Date.now() - new Date(outfit.lastWorn)) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastWorn > 30) score += 0.3;
      else if (daysSinceLastWorn > 14) score += 0.2;
      else if (daysSinceLastWorn > 7) score += 0.1;
      else score -= 0.1; // Mặc mới đây, giảm điểm
    }
    
    // Ưu tiên outfit có lịch sử yêu thích/đánh giá cao
    if (outfit.favoriteCount && outfit.favoriteCount > 0) {
      score += 0.05 * Math.min(outfit.favoriteCount, 5); // Tối đa +0.25
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm phù hợp của item với thời tiết
   * @private
   */
  static _calculateItemWeatherMatchScore(item, weather) {
    if (!weather || !item) return 0.5;
    
    let score = 0.5;
    
    // Kiểm tra nhiệt độ
    if (weather.temperature !== undefined) {
      if (item.season === 'winter' && weather.temperature < 10) score += 0.25;
      else if (item.season === 'fall' && weather.temperature >= 10 && weather.temperature < 20) score += 0.25;
      else if (item.season === 'spring' && weather.temperature >= 15 && weather.temperature < 25) score += 0.25;
      else if (item.season === 'summer' && weather.temperature >= 25) score += 0.25;
      else if (item.season === 'all') score += 0.15;
      else score -= 0.15;
    }
    
    // Kiểm tra tags
    if (weather.weatherTags && item.tags) {
      const matchingTags = weather.weatherTags.filter(tag => item.tags.includes(tag));
      score += 0.05 * matchingTags.length;
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm phù hợp của item với dịp/sự kiện
   * @private
   */
  static _calculateItemOccasionMatchScore(item, occasion) {
    if (!occasion || !item) return 0.5;
    
    let score = 0.5;
    
    // Kiểm tra occasion match chính xác
    if (item.occasion && item.occasion.toLowerCase() === occasion.toLowerCase()) {
      score += 0.4;
    }
    // Kiểm tra occasion match một phần
    else if (item.occasion && item.occasion.toLowerCase().includes(occasion.toLowerCase())) {
      score += 0.2;
    }
    // Kiểm tra occasion match một phần
    else if (occasion && item.occasion && occasion.toLowerCase().includes(item.occasion.toLowerCase())) {
      score += 0.1;
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm phù hợp của item với mùa
   * @private
   */
  static _calculateItemSeasonMatchScore(item, season) {
    if (!season || !item) return 0.5;
    
    let score = 0.5;
    
    // Kiểm tra season match chính xác
    if (item.season && item.season.toLowerCase() === season.toLowerCase()) {
      score += 0.4;
    }
    // Item phù hợp với mọi mùa
    else if (item.season && item.season.toLowerCase() === 'all') {
      score += 0.3;
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tính điểm phù hợp của item với preferences của người dùng
   * @private
   */
  static _calculateItemPreferencesMatchScore(item, preferences) {
    if (!preferences || !item) return 0.5;
    
    let score = 0.5;
    
    // Kiểm tra favorite colors
    if (preferences.favoriteColors && preferences.favoriteColors.length > 0) {
      if (item.color && preferences.favoriteColors.some(color => 
        item.color.toLowerCase().includes(color.toLowerCase())
      )) {
        score += 0.2;
      }
    }
    
    // Kiểm tra favorite categories
    if (preferences.favoriteCategories && preferences.favoriteCategories.length > 0) {
      if (item.category && preferences.favoriteCategories.includes(item.category)) {
        score += 0.2;
      }
    }
    
    // Kiểm tra disliked colors
    if (preferences.dislikedColors && preferences.dislikedColors.length > 0) {
      if (item.color && preferences.dislikedColors.some(color => 
        item.color.toLowerCase().includes(color.toLowerCase())
      )) {
        score -= 0.3;
      }
    }
    
    // Kiểm tra disliked patterns
    if (preferences.dislikedPatterns && preferences.dislikedPatterns.length > 0) {
      if (item.pattern && preferences.dislikedPatterns.includes(item.pattern)) {
        score -= 0.3;
      }
    }
    
    // Giới hạn điểm trong khoảng [0, 1]
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Tạo description về lý do đề xuất
   * @private
   */
  static _generateReasonDescription(data) {
    const { outfit, weatherMatchScore, occasionMatchScore, seasonMatchScore, preferencesScore, context } = data;
    const reasons = [];
    
    if (weatherMatchScore > 0.7) {
      reasons.push(`Phù hợp với thời tiết ${context.weather.temperature || ''}°C, ${context.weather.condition || ''}`);
    }
    
    if (occasionMatchScore > 0.7) {
      reasons.push(`Phù hợp với dịp ${context.occasion || ''}`);
    }
    
    if (seasonMatchScore > 0.7) {
      reasons.push(`Phù hợp với mùa ${context.season || ''}`);
    }
    
    if (preferencesScore > 0.7) {
      reasons.push('Phù hợp với sở thích của bạn');
    }
    
    // Nếu không có lý do cụ thể, thêm mô tả chung
    if (reasons.length === 0) {
      reasons.push('Trang phục được đề xuất dựa trên nhiều yếu tố');
    }
    
    return reasons;
  }
}

module.exports = RecommendationEngineService; 