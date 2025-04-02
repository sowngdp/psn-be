'use strict';

const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    outfitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outfit',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['work', 'casual', 'party', 'date', 'meeting', 'travel', 'special', 'other'],
      default: 'other',
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    weatherInfo: {
      temperature: Number,
      condition: String,
      humidity: Number,
      precipitation: Number,
      icon: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['planned', 'worn', 'canceled', 'rescheduled'],
      default: 'planned',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
      },
      interval: {
        type: Number,
        default: 1,
      },
      endDate: Date,
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      time: Date, // Thời gian cụ thể để gửi nhắc nhở
    },
  },
  {
    timestamps: true,
  }
);

ScheduleSchema.index({ ownerId: 1, date: 1 });
ScheduleSchema.index({ outfitId: 1 });
ScheduleSchema.index({ eventType: 1 });
ScheduleSchema.index({ status: 1 });

// Method để đánh dấu là đã mặc và tăng wear count của outfit và các items
ScheduleSchema.methods.markAsWorn = async function() {
  this.status = 'worn';
  
  // Cập nhật outfit
  const Outfit = mongoose.model('Outfit');
  const outfit = await Outfit.findById(this.outfitId);
  
  if (outfit) {
    await outfit.markAsWorn();
  }
  
  return this.save();
};

module.exports = mongoose.model('Schedule', ScheduleSchema); 
