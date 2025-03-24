const mongoose = require('mongoose');

const StyleRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    ruleType: {
      type: String,
      enum: [
        'color_combination',
        'pattern_matching',
        'proportion',
        'occasion',
        'body_type',
        'season',
        'general',
      ],
      required: true,
    },
    conditions: [
      {
        attribute: {
          type: String,
          required: true,
        },
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'not_contains'],
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
      },
    ],
    recommendations: [
      {
        type: {
          type: String,
          enum: ['replace', 'add', 'remove', 'change_color', 'general'],
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        suggestionItems: [
          {
            category: String,
            attributes: mongoose.Schema.Types.Mixed,
          },
        ],
      },
    ],
    score: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    weight: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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