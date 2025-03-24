const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'event', 'weather', 'season', 'style', 'occasion'],
      required: true,
    },
    recommendedItems: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
        },
        score: {
          type: Number,
          min: 0,
          max: 1,
          default: 0,
        },
        reason: {
          type: String,
        },
      },
    ],
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
          default: 0,
        },
        reason: {
          type: String,
        },
      },
    ],
    context: {
      date: Date,
      weather: {
        temperature: Number,
        condition: String,
        humidity: Number,
      },
      occasion: String,
      location: String,
      promptText: String,
    },
    userFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      selectedOutfitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outfit',
      },
      feedbackDate: Date,
    },
    aiModelInfo: {
      modelName: String,
      version: String,
      params: mongoose.Schema.Types.Mixed,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

RecommendationSchema.index({ ownerId: 1 });
RecommendationSchema.index({ type: 1 });
RecommendationSchema.index({ 'context.date': 1 });
RecommendationSchema.index({ isUsed: 1 });

module.exports = mongoose.model('Recommendation', RecommendationSchema); 