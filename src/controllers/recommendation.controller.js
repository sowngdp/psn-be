'use strict';

const RecommendationService = require('../services/recommendation.service');
const { OK, CREATED } = require('../core/success.response');

class RecommendationController {
  // Tạo đề xuất mới
  static async createRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { type, context } = req.body;
      
      const newRecommendation = await RecommendationService.createRecommendation({
        userId,
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
      
      const recommendations = await RecommendationService.getUserRecommendations(
        userId,
        {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          type
        }
      );
      
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
      
      const recommendation = await RecommendationService.getRecommendationById(recommendationId, userId);
      
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

  // Lấy đề xuất hàng ngày
  static async getDailyRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const dailyRecommendation = await RecommendationService.getDailyRecommendation(userId);
      
      return new OK({
        message: 'Lấy đề xuất hàng ngày thành công',
        metadata: dailyRecommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Tạo đề xuất theo sự kiện
  static async getEventRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { occasion, date } = req.body;
      
      const recommendation = await RecommendationService.createRecommendation({
        userId,
        type: 'event',
        context: { occasion, date }
      });
      
      return new OK({
        message: 'Tạo đề xuất cho sự kiện thành công',
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
      
      const recommendation = await RecommendationService.createRecommendation({
        userId,
        type: 'weather',
        context: { 
          weather: { temperature, condition },
          date,
          location
        }
      });
      
      return new OK({
        message: 'Tạo đề xuất theo thời tiết thành công',
        metadata: recommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Tạo đề xuất theo mùa
  static async getSeasonRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { season } = req.body;
      
      const recommendation = await RecommendationService.createRecommendation({
        userId,
        type: 'season',
        context: { season }
      });
      
      return new OK({
        message: 'Tạo đề xuất theo mùa thành công',
        metadata: recommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Tạo đề xuất theo phong cách
  static async getStyleRecommendation(req, res, next) {
    try {
      const userId = req.user.userId;
      const { styles } = req.body;
      
      const recommendation = await RecommendationService.createRecommendation({
        userId,
        type: 'style',
        context: { styles }
      });
      
      return new OK({
        message: 'Tạo đề xuất theo phong cách thành công',
        metadata: recommendation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RecommendationController; 