'use strict';

const RecommendationService = require('../../services/recommendation.service');
const { OK, CREATED } = require('../../core/success.response');

class RecommendationController {
  // Tạo đề xuất mới
  static async createRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { type, context } = req.body;
      
      const newRecommendation = await RecommendationService.createRecommendation({
        ownerId: userId,
        type,
        context
      });
      
      return new CREATED({
        message: 'Tạo đề xuất thành công',
        metadata: newRecommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách đề xuất của người dùng
  static async getUserRecommendations(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page, limit, type } = req.query;
      
      const recommendations = await RecommendationService.findUserRecommendations({
        userId,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        type
      });
      
      return new OK({
        message: 'Lấy danh sách đề xuất thành công',
        metadata: recommendations
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy chi tiết đề xuất
  static async getRecommendationById(req, res, next) {
    try {
      const recommendationId = req.params.id;
      const userId = req.user.userId;
      
      const recommendation = await RecommendationService.findRecommendationById(recommendationId, userId);
      
      return new OK({
        message: 'Lấy thông tin đề xuất thành công',
        metadata: recommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Cập nhật phản hồi người dùng cho đề xuất
  static async updateFeedback(req, res, next) {
    try {
      const recommendationId = req.params.id;
      const userId = req.user.userId;
      const { rating, comment, selectedOutfitId } = req.body;
      
      const updatedRecommendation = await RecommendationService.updateFeedback(
        recommendationId, 
        userId, 
        { rating, comment, selectedOutfitId }
      );
      
      return new OK({
        message: 'Cập nhật phản hồi thành công',
        metadata: updatedRecommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Đánh dấu đề xuất đã được sử dụng
  static async markAsUsed(req, res, next) {
    try {
      const recommendationId = req.params.id;
      const userId = req.user.userId;
      
      const updatedRecommendation = await RecommendationService.markAsUsed(recommendationId, userId);
      
      return new OK({
        message: 'Đánh dấu đề xuất đã sử dụng thành công',
        metadata: updatedRecommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Tạo đề xuất dựa trên dịp
  static async getOccasionRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { occasion, date, location } = req.body;
      
      const recommendation = await RecommendationService.createOccasionRecommendation({
        userId,
        occasion,
        date,
        location
      });
      
      return new OK({
        message: 'Tạo đề xuất theo dịp thành công',
        metadata: recommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Tạo đề xuất dựa trên thời tiết
  static async getWeatherRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { temperature, condition, date, location } = req.body;
      
      const recommendation = await RecommendationService.createWeatherRecommendation({
        userId,
        weather: { temperature, condition },
        date,
        location
      });
      
      return new OK({
        message: 'Tạo đề xuất theo thời tiết thành công',
        metadata: recommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Tạo đề xuất dựa trên mùa
  static async getSeasonRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { season } = req.body;
      
      const recommendation = await RecommendationService.createSeasonRecommendation({
        userId,
        season: season || null // Nếu không cung cấp, sẽ sử dụng mùa hiện tại
      });
      
      return new OK({
        message: 'Tạo đề xuất theo mùa thành công',
        metadata: recommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy đề xuất hàng ngày
  static async getDailyRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Tìm đề xuất hàng ngày hiện có hoặc tạo mới
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyRecommendation = await RecommendationService.findOrCreateDailyRecommendation(userId, today);
      
      return new OK({
        message: 'Lấy đề xuất hàng ngày thành công',
        metadata: dailyRecommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RecommendationController; 
