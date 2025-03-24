const mongoose = require('mongoose');

const StyleRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    ruleType: {
      type: String,
      enum: ['color_combination', 'pattern_matching', 'proportion', 'occasion', 'body_type', 'season', 'general'],
      required: true,
    },
    conditions: [{
      attribute: String, // 'category', 'color', 'pattern', etc.
      operator: {
        type: String,
        enum: ['equals', 'contains', 'not_equals', 'greater_than', 'less_than', 'in', 'not_in'],
      },
      value: mongoose.Schema.Types.Mixed,
    }],
    recommendations: [{
      attribute: String,
      value: mongoose.Schema.Types.Mixed,
      explanation: String,
    }],
    score: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    applicableBodyTypes: [{
      type: String,
      enum: ['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle', 'all'],
    }],
    applicableSeasons: [{
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all'],
    }],
  },
  {
    timestamps: true,
  }
);

StyleRuleSchema.index({ ruleType: 1 });
StyleRuleSchema.index({ isActive: 1 });
StyleRuleSchema.index({ isSystem: 1 });
StyleRuleSchema.index({ 'applicableBodyTypes': 1 });
StyleRuleSchema.index({ 'applicableSeasons': 1 });

module.exports = mongoose.model('StyleRule', StyleRuleSchema); 