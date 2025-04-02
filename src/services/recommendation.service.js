'use strict';

const recommendationModel = require('../db/models/recommendation.model');
const outfitModel = require('../db/models/outfit.model');
const itemModel = require('../db/models/item.model');
const userStyleProfileModel = require('../db/models/user-style-profile.model');
const StyleRuleService = require('./style-rule.service');
const { BadRequestError, NotFoundError } = require('../core/error.response');
const { Types } = require('mongoose');

class RecommendationService {
  // Tạo đề xuất mới
  static async createRecommendation(recommendationData) {
    const { userId, type, context } = recommendationData;
    
    // Kiểm tra và làm sạch dữ liệu
    if (!userId || !type) {
      throw new BadRequestError('Thiếu thông tin cần thiết');
    }
    
    // Tạo đề xuất mới
    const newRecommendation = await recommendationModel.create({
      userId,
      type,
      context: context || {},
      status: 'pending',
      createdAt: new Date(),
      recommendedOutfits: []
    });
    
    // Xử lý đề xuất tùy theo loại
    let processedRecommendation;
    switch (type) {
      case 'event':
        processedRecommendation = await this.processEventRecommendation(newRecommendation);
        break;
      case 'weather':
        processedRecommendation = await this.processWeatherRecommendation(newRecommendation);
        break;
      case 'season':
        processedRecommendation = await this.processSeasonRecommendation(newRecommendation);
        break;
      case 'daily':
        processedRecommendation = await this.processDailyRecommendation(newRecommendation);
        break;
      case 'style':
        processedRecommendation = await this.processStyleRecommendation(newRecommendation);
        break;
      default:
        processedRecommendation = newRecommendation;
    }
    
    return processedRecommendation;
  }
  
  // Xử lý đề xuất cho sự kiện
  static async processEventRecommendation(recommendation) {
    const { userId, context } = recommendation;
    
    if (!context || !context.occasion) {
      throw new BadRequestError('Thiếu thông tin về sự kiện');
    }
    
    const { occasion } = context;
    
    // Tìm các outfit phù hợp với dịp
    const outfits = await outfitModel.find({
      ownerId: userId,
      occasion: { $regex: new RegExp(occasion, 'i') },
      inCloset: true
    }).limit(10);
    
    // Nếu có đủ outfit thì đánh giá chúng
    if (outfits.length >= 3) {
      const scoredOutfits = await Promise.all(outfits.map(async outfit => {
        try {
          // Đánh giá outfit theo quy tắc phong cách
          const evaluation = await StyleRuleService.evaluateOutfit(outfit._id, userId);
          
          return {
            outfitId: outfit._id,
            score: evaluation.overallScore,
            reason: `Phù hợp với dịp ${occasion}, điểm đánh giá: ${evaluation.overallScore.toFixed(2)}`
          };
        } catch (error) {
          return {
            outfitId: outfit._id,
            score: 0.5,
            reason: `Phù hợp với dịp ${occasion}`
          };
        }
      }));
      
      // Sắp xếp và chọn 5 outfit tốt nhất
      const bestOutfits = scoredOutfits
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      // Cập nhật đề xuất
      const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
        recommendation._id,
        { 
          $set: { 
            recommendedOutfits: bestOutfits,
            status: 'completed' 
          } 
        },
        { new: true }
      );
      
      return updatedRecommendation;
    }
    
    // Nếu không đủ outfit, tìm các item phù hợp với dịp
    const items = await itemModel.find({
      ownerId: userId,
      occasion: { $regex: new RegExp(occasion, 'i') },
      inCloset: true
    }).limit(20);
    
    // Gợi ý tạo outfit mới từ các item
    const suggestedItems = items.slice(0, 10).map(item => ({
      itemId: item._id,
      reason: `Item phù hợp với dịp ${occasion}`
    }));
    
    // Cập nhật đề xuất
    const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
      recommendation._id,
      { 
        $set: { 
          suggestedItems,
          status: 'completed',
          message: `Không tìm thấy đủ trang phục cho dịp ${occasion}. Gợi ý một số item phù hợp.`
        } 
      },
      { new: true }
    );
    
    return updatedRecommendation;
  }
  
  // Xử lý đề xuất theo thời tiết
  static async processWeatherRecommendation(recommendation) {
    const { userId, context } = recommendation;
    
    if (!context || !context.weather) {
      throw new BadRequestError('Thiếu thông tin về thời tiết');
    }
    
    const { temperature, condition } = context.weather;
    
    // Xác định mùa dựa trên nhiệt độ
    let season = 'all';
    if (temperature < 10) season = 'winter';
    else if (temperature < 20) season = 'fall';
    else if (temperature < 30) season = 'spring';
    else season = 'summer';
    
    // Xác định các tag liên quan đến điều kiện thời tiết
    const weatherTags = [];
    if (condition) {
      if (condition.toLowerCase().includes('rain')) {
        weatherTags.push('waterproof', 'rain-friendly');
      }
      if (condition.toLowerCase().includes('snow')) {
        weatherTags.push('winter', 'warm', 'snow');
      }
      if (condition.toLowerCase().includes('wind') || condition.toLowerCase().includes('windy')) {
        weatherTags.push('windproof', 'layered');
      }
      if (condition.toLowerCase().includes('hot') || temperature > 30) {
        weatherTags.push('summer', 'cool', 'breathable');
      }
      if (condition.toLowerCase().includes('cold') || temperature < 10) {
        weatherTags.push('winter', 'warm', 'insulated');
      }
    }
    
    // Tìm các outfit phù hợp
    const weatherQuery = {
      ownerId: userId,
      inCloset: true,
      $or: [
        { season },
        { season: 'all' }
      ]
    };
    
    // Thêm các tag nếu có
    if (weatherTags.length > 0) {
      weatherQuery.tags = { $in: weatherTags };
    }
    
    const outfits = await outfitModel.find(weatherQuery).limit(10);
    
    // Nếu có đủ outfit thì đánh giá chúng
    if (outfits.length >= 3) {
      const scoredOutfits = await Promise.all(outfits.map(async outfit => {
        try {
          // Đánh giá outfit theo quy tắc phong cách
          const evaluation = await StyleRuleService.evaluateOutfit(outfit._id, userId);
          
          return {
            outfitId: outfit._id,
            score: evaluation.overallScore,
            reason: `Phù hợp với nhiệt độ ${temperature}°C, ${condition}, điểm đánh giá: ${evaluation.overallScore.toFixed(2)}`
          };
        } catch (error) {
          return {
            outfitId: outfit._id,
            score: 0.5,
            reason: `Phù hợp với nhiệt độ ${temperature}°C, ${condition}`
          };
        }
      }));
      
      // Sắp xếp và chọn 5 outfit tốt nhất
      const bestOutfits = scoredOutfits
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      // Cập nhật đề xuất
      const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
        recommendation._id,
        { 
          $set: { 
            recommendedOutfits: bestOutfits,
            status: 'completed' 
          } 
        },
        { new: true }
      );
      
      return updatedRecommendation;
    }
    
    // Nếu không đủ outfit, tìm các item phù hợp
    const itemQuery = {
      ownerId: userId,
      inCloset: true,
      $or: [
        { season },
        { season: 'all' }
      ]
    };
    
    // Thêm các tag nếu có
    if (weatherTags.length > 0) {
      itemQuery.tags = { $in: weatherTags };
    }
    
    const items = await itemModel.find(itemQuery).limit(20);
    
    // Gợi ý tạo outfit mới từ các item
    const suggestedItems = items.slice(0, 10).map(item => ({
      itemId: item._id,
      reason: `Item phù hợp với ${temperature}°C, ${condition}`
    }));
    
    // Cập nhật đề xuất
    const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
      recommendation._id,
      { 
        $set: { 
          suggestedItems,
          status: 'completed',
          message: `Không tìm thấy đủ trang phục cho thời tiết ${temperature}°C, ${condition}. Gợi ý một số item phù hợp.`
        } 
      },
      { new: true }
    );
    
    return updatedRecommendation;
  }
  
  // Xử lý đề xuất theo mùa
  static async processSeasonRecommendation(recommendation) {
    const { userId, context } = recommendation;
    
    // Xác định mùa từ context hoặc hiện tại
    let season = context?.season;
    
    // Xác định mùa nếu không cung cấp
    if (!season) {
      season = StyleRuleService._getCurrentSeason();
    }
    
    // Lấy các outfit phù hợp với mùa
    const seasonalOutfits = await outfitModel.find({
      ownerId: userId,
      $or: [
        { season },
        { season: 'all' }
      ],
      inCloset: true
    }).limit(15);
    
    // Nếu có ít nhất 3 outfit phù hợp với mùa, đề xuất chúng
    if (seasonalOutfits.length >= 3) {
      // Đánh giá mỗi outfit
      const scoredOutfits = await Promise.all(seasonalOutfits.map(async outfit => {
        try {
          // Thử đánh giá outfit theo quy tắc
          const evaluation = await StyleRuleService.evaluateOutfit(outfit._id, userId);
          
          return {
            outfitId: outfit._id,
            score: evaluation.overallScore,
            reason: `Phù hợp với mùa ${season}, điểm đánh giá: ${evaluation.overallScore.toFixed(2)}`
          };
        } catch (error) {
          // Nếu có lỗi, vẫn đề xuất nhưng với điểm thấp hơn
          return {
            outfitId: outfit._id,
            score: 0.5,
            reason: `Phù hợp với mùa ${season}`
          };
        }
      }));
      
      // Sắp xếp và chọn 5 outfit tốt nhất
      const bestOutfits = scoredOutfits
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      // Cập nhật đề xuất
      const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
        recommendation._id,
        { 
          $set: { 
            recommendedOutfits: bestOutfits,
            status: 'completed' 
          }
        },
        { new: true }
      );
      
      return updatedRecommendation;
    }
    
    // Nếu không có đủ outfit, đề xuất các item phù hợp với mùa
    // Lấy các item phù hợp với mùa
    const seasonalItems = await itemModel.find({
      ownerId: userId,
      $or: [
        { season },
        { season: 'all' },
        { tags: season }
      ],
      inCloset: true
    }).limit(30);
    
    // Gợi ý tạo outfit mới từ các item
    const suggestedItems = seasonalItems.slice(0, 10).map(item => ({
      itemId: item._id,
      reason: `Item phù hợp với mùa ${season}`
    }));
    
    // Cập nhật đề xuất
    const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
      recommendation._id,
      { 
        $set: { 
          suggestedItems,
          status: 'completed',
          message: `Không tìm thấy đủ trang phục cho mùa ${season}. Gợi ý một số item phù hợp.`
        } 
      },
      { new: true }
    );
    
    return updatedRecommendation;
  }
  
  // Xử lý đề xuất hàng ngày
  static async processDailyRecommendation(recommendation) {
    const { userId } = recommendation;
    
    // Lấy thông tin profile để đề xuất phù hợp
    const userProfile = await userStyleProfileModel.findOne({ userId });
    
    // Lấy các outfit chưa mặc trong 7 ngày gần đây
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentOutfits = await outfitModel.find({
      ownerId: userId,
      inCloset: true,
      $or: [
        { lastWorn: { $lt: oneWeekAgo } },
        { lastWorn: { $exists: false } }
      ]
    }).sort({ styleScore: -1 }).limit(15);
    
    // Nếu có ít nhất 3 outfit, chọn ngẫu nhiên 5 outfit từ 10 outfit có styleScore cao nhất
    if (recentOutfits.length >= 3) {
      // Đánh giá các outfit
      const scoredOutfits = await Promise.all(recentOutfits.map(async outfit => {
        try {
          // Thử đánh giá outfit theo quy tắc
          const evaluation = await StyleRuleService.evaluateOutfit(outfit._id, userId);
          
          return {
            outfitId: outfit._id,
            score: evaluation.overallScore,
            reason: `Đề xuất hàng ngày với điểm: ${evaluation.overallScore.toFixed(2)}`
          };
        } catch (error) {
          return {
            outfitId: outfit._id,
            score: outfit.styleScore || 0.5,
            reason: 'Đề xuất hàng ngày'
          };
        }
      }));
      
      // Sắp xếp theo điểm và chọn ngẫu nhiên 5 outfit từ 10 outfit hàng đầu
      const topOutfits = scoredOutfits
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      // Xáo trộn mảng để chọn ngẫu nhiên
      const shuffled = [...topOutfits].sort(() => 0.5 - Math.random());
      const selectedOutfits = shuffled.slice(0, 5);
      
      // Cập nhật đề xuất
      const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
        recommendation._id,
        { 
          $set: { 
            recommendedOutfits: selectedOutfits,
            status: 'completed' 
          } 
        },
        { new: true }
      );
      
      return updatedRecommendation;
    }
    
    // Nếu không có đủ outfit, tạo gợi ý trang phục mới từ các item phổ biến
    const popularItems = await itemModel.find({
      ownerId: userId,
      inCloset: true
    }).sort({ wearCount: -1 }).limit(20);
    
    // Phân loại item theo category
    const itemsByCategory = {};
    popularItems.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });
    
    // Lấy các item hàng đầu theo category
    const suggestedItems = [];
    for (const category in itemsByCategory) {
      if (itemsByCategory[category].length > 0) {
        suggestedItems.push({
          itemId: itemsByCategory[category][0]._id,
          reason: `Item ${category} phổ biến nhất của bạn`
        });
      }
    }
    
    // Cập nhật đề xuất
    const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
      recommendation._id,
      { 
        $set: { 
          suggestedItems: suggestedItems.slice(0, 5),
          status: 'completed',
          message: 'Không tìm thấy đủ trang phục cho đề xuất hàng ngày. Gợi ý một số item phổ biến.'
        } 
      },
      { new: true }
    );
    
    return updatedRecommendation;
  }
  
  // Xử lý đề xuất theo phong cách
  static async processStyleRecommendation(recommendation) {
    const { userId, context } = recommendation;
    
    // Lấy thông tin profile người dùng
    const userProfile = await userStyleProfileModel.findOne({ userId });
    
    if (!userProfile || !userProfile.stylePreferences || userProfile.stylePreferences.length === 0) {
      throw new BadRequestError('Không tìm thấy thông tin phong cách ưa thích trong profile');
    }
    
    // Lấy các phong cách ưa thích từ context hoặc profile
    const styles = context?.styles || userProfile.stylePreferences;
    
    // Tìm các outfit phù hợp với phong cách
    const styleOutfits = await outfitModel.find({
      ownerId: userId,
      inCloset: true,
      $or: [
        { style: { $in: styles } },
        { tags: { $in: styles } }
      ]
    }).limit(15);
    
    // Nếu có đủ outfit, đánh giá chúng
    if (styleOutfits.length >= 3) {
      const scoredOutfits = await Promise.all(styleOutfits.map(async outfit => {
        try {
          // Đánh giá outfit theo quy tắc phong cách
          const evaluation = await StyleRuleService.evaluateOutfit(outfit._id, userId, ['style', 'general']);
          
          return {
            outfitId: outfit._id,
            score: evaluation.overallScore,
            reason: `Phù hợp với phong cách ${styles.join(', ')}, điểm đánh giá: ${evaluation.overallScore.toFixed(2)}`
          };
        } catch (error) {
          return {
            outfitId: outfit._id,
            score: 0.5,
            reason: `Phù hợp với phong cách ${styles.join(', ')}`
          };
        }
      }));
      
      // Sắp xếp và chọn 5 outfit tốt nhất
      const bestOutfits = scoredOutfits
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      // Cập nhật đề xuất
      const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
        recommendation._id,
        { 
          $set: { 
            recommendedOutfits: bestOutfits,
            status: 'completed' 
          } 
        },
        { new: true }
      );
      
      return updatedRecommendation;
    }
    
    // Nếu không có đủ outfit, tìm các item phù hợp với phong cách
    const styleItems = await itemModel.find({
      ownerId: userId,
      inCloset: true,
      $or: [
        { style: { $in: styles } },
        { tags: { $in: styles } }
      ]
    }).limit(30);
    
    // Gợi ý tạo outfit mới từ các item
    const suggestedItems = styleItems.slice(0, 10).map(item => ({
      itemId: item._id,
      reason: `Item phù hợp với phong cách ${styles.join(', ')}`
    }));
    
    // Cập nhật đề xuất
    const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
      recommendation._id,
      { 
        $set: { 
          suggestedItems,
          status: 'completed',
          message: `Không tìm thấy đủ trang phục cho phong cách ${styles.join(', ')}. Gợi ý một số item phù hợp.`
        } 
      },
      { new: true }
    );
    
    return updatedRecommendation;
  }
  
  // Lấy đề xuất theo ID
  static async getRecommendationById(recommendationId, userId) {
    const recommendation = await recommendationModel.findOne({
      _id: recommendationId,
      userId
    });
    
    if (!recommendation) {
      throw new NotFoundError('Không tìm thấy đề xuất');
    }
    
    // Nếu có recommendedOutfits, populate thông tin
    if (recommendation.recommendedOutfits && recommendation.recommendedOutfits.length > 0) {
      const outfitIds = recommendation.recommendedOutfits.map(ro => ro.outfitId);
      const outfits = await outfitModel.find({ _id: { $in: outfitIds } })
        .populate('items.itemId');
      
      // Thêm thông tin chi tiết về outfit vào kết quả
      const recommendedOutfitsWithDetails = recommendation.recommendedOutfits.map(ro => {
        const outfitDetails = outfits.find(o => o._id.toString() === ro.outfitId.toString());
        return {
          ...ro.toObject(),
          outfit: outfitDetails
        };
      });
      
      recommendation._doc.recommendedOutfitsWithDetails = recommendedOutfitsWithDetails;
    }
    
    // Nếu có suggestedItems, populate thông tin
    if (recommendation.suggestedItems && recommendation.suggestedItems.length > 0) {
      const itemIds = recommendation.suggestedItems.map(si => si.itemId);
      const items = await itemModel.find({ _id: { $in: itemIds } });
      
      // Thêm thông tin chi tiết về item vào kết quả
      const suggestedItemsWithDetails = recommendation.suggestedItems.map(si => {
        const itemDetails = items.find(i => i._id.toString() === si.itemId.toString());
        return {
          ...si.toObject(),
          item: itemDetails
        };
      });
      
      recommendation._doc.suggestedItemsWithDetails = suggestedItemsWithDetails;
    }
    
    return recommendation;
  }
  
  // Lấy danh sách đề xuất của người dùng
  static async getUserRecommendations(userId, { page = 1, limit = 10, type }) {
    const filter = { userId };
    
    // Thêm filter theo loại nếu có
    if (type) {
      filter.type = type;
    }
    
    // Đếm tổng số đề xuất
    const totalRecommendations = await recommendationModel.countDocuments(filter);
    
    // Lấy danh sách đề xuất với phân trang
    const recommendations = await recommendationModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    return {
      recommendations,
      pagination: {
        page,
        limit,
        totalRecommendations,
        totalPages: Math.ceil(totalRecommendations / limit)
      }
    };
  }
  
  // Cập nhật phản hồi cho đề xuất
  static async updateFeedback(recommendationId, userId, { rating, comment, selectedOutfitId }) {
    // Kiểm tra đề xuất tồn tại và thuộc về người dùng
    const recommendation = await recommendationModel.findOne({
      _id: recommendationId,
      userId
    });
    
    if (!recommendation) {
      throw new NotFoundError('Không tìm thấy đề xuất');
    }
    
    // Cập nhật phản hồi
    const updatedRecommendation = await recommendationModel.findByIdAndUpdate(
      recommendationId,
      { 
        $set: { 
          feedback: {
            rating,
            comment,
            selectedOutfitId,
            createdAt: new Date()
          } 
        } 
      },
      { new: true }
    );
    
    return updatedRecommendation;
  }
  
  // Tìm hoặc tạo đề xuất hàng ngày
  static async findOrCreateDailyRecommendation(userId, date) {
    // Tìm đề xuất hàng ngày đã tồn tại
    const existingRecommendation = await recommendationModel.findOne({
      userId,
      type: 'daily',
      createdAt: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // Nếu đã có, trả về đề xuất đó
    if (existingRecommendation) {
      return existingRecommendation;
    }
    
    // Nếu chưa có, tạo đề xuất mới
    const newRecommendation = await this.createRecommendation({
      userId,
      type: 'daily',
      context: {}
    });
    
    return newRecommendation;
  }
}

module.exports = RecommendationService; 
