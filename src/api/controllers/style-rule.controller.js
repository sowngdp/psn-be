'use strict';

const StyleRuleService = require('../../services/style-rule.service');
const { OK, CREATED } = require('../../core/success.response');

class StyleRuleController {
  // Tạo quy tắc phong cách mới
  static async createStyleRule(req, res, next) {
    try {
      const userId = req.user.userId;
      const ruleData = { ...req.body, createdBy: userId };
      const newRule = await StyleRuleService.createStyleRule(ruleData);
      return new CREATED({
        message: 'Tạo quy tắc phong cách thành công',
        metadata: newRule
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy danh sách quy tắc phong cách
  static async getStyleRules(req, res, next) {
    try {
      const { page, limit, type } = req.query;
      const userId = req.user.userId;
      const rules = await StyleRuleService.getStyleRules({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        type,
        userId
      });
      return new OK({
        message: 'Lấy danh sách quy tắc phong cách thành công',
        metadata: rules
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Đánh giá trang phục theo quy tắc
  static async evaluateOutfit(req, res, next) {
    try {
      const { outfitId, ruleTypes } = req.body;
      const userId = req.user.userId;
      
      const evaluation = await StyleRuleService.evaluateOutfit(outfitId, userId, ruleTypes);
      
      return new OK({
        message: 'Đánh giá trang phục thành công',
        metadata: evaluation
      }).send(res);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StyleRuleController; 