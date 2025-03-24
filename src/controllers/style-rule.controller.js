'use strict';

const StyleRuleService = require('../services/style-rule.service');
const { OK, CREATED } = require('../core/success.response');

class StyleRuleController {
  // Lấy tất cả quy tắc phong cách
  static async getAllStyleRules(req, res, next) {
    try {
      const { ruleType, isActive } = req.query;
      const userId = req.user.userId;
      
      const styleRules = await StyleRuleService.getAllStyleRules({
        ruleType, 
        isActive: isActive === 'true',
        userId
      });
      
      return new OK({
        message: 'Lấy danh sách quy tắc phong cách thành công',
        metadata: styleRules
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Lấy quy tắc phong cách theo ID
  static async getStyleRuleById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      const styleRule = await StyleRuleService.getStyleRuleById(id, userId);
      
      return new OK({
        message: 'Lấy thông tin quy tắc phong cách thành công',
        metadata: styleRule
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

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

  // Cập nhật quy tắc phong cách
  static async updateStyleRule(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const updateData = req.body;
      
      const updatedRule = await StyleRuleService.updateStyleRule(id, userId, updateData);
      
      return new OK({
        message: 'Cập nhật quy tắc phong cách thành công',
        metadata: updatedRule
      }).send(res);
    } catch (error) {
      next(error);
    }
  }

  // Xóa quy tắc phong cách
  static async deleteStyleRule(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      
      await StyleRuleService.deleteStyleRule(id, userId);
      
      return new OK({
        message: 'Xóa quy tắc phong cách thành công'
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