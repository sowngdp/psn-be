'use strict';

const mongoose = require('mongoose');

const OutfitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true,
        },
        position: {
          type: String,
          enum: ['top', 'bottom', 'outer', 'accessory', 'footwear', 'other'],
        },
      },
    ],
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all'],
      default: 'all',
    },
    occasion: {
      type: String,
    },
    styleScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    tags: [String],
    inCloset: {
      type: Boolean,
      default: true,
    },
    wearCount: {
      type: Number,
      default: 0,
    },
    lastWorn: {
      type: Date,
    },
    wearHistory: [
      {
        date: {
          type: Date,
        },
        occasion: {
          type: String,
        },
        notes: {
          type: String,
        },
      },
    ],
    imageUrl: {
      type: String,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OutfitSchema.index({ ownerId: 1 });
OutfitSchema.index({ season: 1 });
OutfitSchema.index({ occasion: 1 });
OutfitSchema.index({ 'items.itemId': 1 });
OutfitSchema.index({ inCloset: 1 });
OutfitSchema.index({ lastWorn: -1 });
OutfitSchema.index({ wearCount: -1 });
OutfitSchema.index({ tags: 1 });

module.exports = mongoose.model('Outfit', OutfitSchema); 
