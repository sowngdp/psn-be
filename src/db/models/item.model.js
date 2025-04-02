'use strict';

const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      enum: ['top', 'bottom', 'outerwear', 'dress', 'footwear', 'accessory', 'other'],
    },
    subCategory: {
      type: String,
    },
    color: {
      type: String,
    },
    pattern: {
      type: String,
    },
    brand: {
      type: String,
    },
    size: {
      type: String,
    },
    material: {
      type: String,
    },
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all'],
      default: 'all',
    },
    occasion: [String],
    style: [String],
    attributes: [String],
    purchaseInfo: {
      date: Date,
      price: Number,
      location: String,
    },
    care: {
      washInstructions: String,
      dryInstructions: String,
      ironInstructions: String,
    },
    tags: [String],
    imageUrl: {
      type: String,
    },
    inCloset: {
      type: Boolean,
      default: true,
    },
    condition: {
      type: String,
      enum: ['new', 'like new', 'good', 'fair', 'poor'],
      default: 'good',
    },
    wearCount: {
      type: Number,
      default: 0,
    },
    lastWorn: {
      type: Date,
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
ItemSchema.index({ ownerId: 1 });
ItemSchema.index({ category: 1 });
ItemSchema.index({ color: 1 });
ItemSchema.index({ season: 1 });
ItemSchema.index({ inCloset: 1 });
ItemSchema.index({ tags: 1 });
ItemSchema.index({ style: 1 });

module.exports = mongoose.model('Item', ItemSchema); 
