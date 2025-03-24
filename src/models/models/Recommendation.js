const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'event', 'weather', 'season', 'style', 'occasion'],
      required: true,
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    message: {
      type: String,
    },
    recommendedOutfits: [
      {
        outfitId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Outfit',
        },
        score: {
          type: Number,
          min: 0,
          max: 1,
        },
        reason: {
          type: String,
        },
      },
    ],
    suggestedItems: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
        },
        reason: {
          type: String,
        },
      },
    ],
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
      },
      selectedOutfitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outfit',
      },
      createdAt: {
        type: Date,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Indexes
RecommendationSchema.index({ userId: 1 });
RecommendationSchema.index({ type: 1 });
RecommendationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Recommendation', RecommendationSchema); 