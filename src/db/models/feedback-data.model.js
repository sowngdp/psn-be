'use strict';

const mongoose = require('mongoose');

const FeedbackDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ['outfit_recommendation', 'app_experience', 'feature_request', 'bug_report', 'style_advice', 'other'],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    relatedEntityType: {
      type: String,
      enum: ['outfit', 'item', 'recommendation', 'feature', 'other'],
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    screenshotUrl: {
      type: String,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    adminResponse: {
      text: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      respondedAt: Date,
    },
    appVersion: {
      type: String,
    },
    deviceInfo: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

FeedbackDataSchema.index({ userId: 1 });
FeedbackDataSchema.index({ feedbackType: 1 });
FeedbackDataSchema.index({ isResolved: 1 });

module.exports = mongoose.model('FeedbackData', FeedbackDataSchema); 
