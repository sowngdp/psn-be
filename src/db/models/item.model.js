const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'top', 'bottom', 'outerwear', 'dress', 'footwear', 
        'accessory', 'bag', 'headwear', 'underwear', 'other'
      ],
    },
    subCategory: {
      type: String,
      trim: true,
    },
    colors: [{
      type: String,
      required: true,
      trim: true,
    }],
    colorHex: [{
      type: String,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    }],
    patterns: [{
      type: String,
      enum: ['solid', 'striped', 'checked', 'floral', 'polka_dot', 'graphic', 'other'],
    }],
    size: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    material: [{
      type: String,
      trim: true,
    }],
    season: [{
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all'],
    }],
    occasions: [{
      type: String,
      enum: ['casual', 'formal', 'business', 'party', 'workout', 'beach', 'other'],
    }],
    imageUrls: [{
      type: String,
    }],
    mainImageUrl: {
      type: String,
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      amount: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'VND',
      },
    },
    condition: {
      type: String,
      enum: ['new', 'like_new', 'good', 'fair', 'poor'],
      default: 'good',
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    wearCount: {
      type: Number,
      default: 0,
    },
    lastWorn: {
      type: Date,
    },
    inCloset: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tạo index cho ownerId để query nhanh danh sách items của user
ItemSchema.index({ ownerId: 1 });
ItemSchema.index({ category: 1 });
ItemSchema.index({ colors: 1 });
ItemSchema.index({ favorite: 1 });
ItemSchema.index({ inCloset: 1 });
ItemSchema.index({ tags: 1 });

// Tính số lần xuất hiện trong outfit
ItemSchema.virtual('outfitCount', {
  ref: 'Outfit',
  localField: '_id',
  foreignField: 'itemIds',
  count: true
});

module.exports = mongoose.model('Item', ItemSchema); 