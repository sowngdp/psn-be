'use strict';

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['top', 'bottom', 'outerwear', 'dress', 'footwear', 'accessory', 'bag', 'headwear', 'underwear', 'other'],
      required: true,
    },
    subCategories: [{
      name: {
        type: String,
        required: true,
        trim: true,
      },
      description: String,
      icon: String,
    }],
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

CategorySchema.index({ name: 1 }, { unique: true });
CategorySchema.index({ type: 1 });

module.exports = mongoose.model('Category', CategorySchema); 
