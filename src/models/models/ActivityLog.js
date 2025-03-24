const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'create_item', 'update_item', 'delete_item',
        'create_outfit', 'update_outfit', 'delete_outfit',
        'schedule_outfit', 'complete_schedule', 'cancel_schedule',
        'get_recommendation', 'give_feedback', 'login', 'logout',
        'update_profile', 'complete_quiz', 'other'
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['item', 'outfit', 'schedule', 'recommendation', 'user', 'profile', 'system', 'other'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    detail: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ entityType: 1 });
ActivityLogSchema.index({ timestamp: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema); 