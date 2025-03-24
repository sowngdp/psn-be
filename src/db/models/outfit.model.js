const mongoose = require('mongoose');

const OutfitSchema = new mongoose.Schema(
  {
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
          enum: ['top', 'bottom', 'outerwear', 'shoes', 'accessory', 'other'],
        },
        layerOrder: {
          type: Number,
          default: 0,
        }
      }
    ],
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    occasions: [{
      type: String,
      enum: ['casual', 'formal', 'business', 'party', 'workout', 'date', 'travel', 'beach', 'other'],
    }],
    seasons: [{
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all'],
    }],
    weather: [{
      type: String,
      enum: ['sunny', 'rainy', 'snowy', 'windy', 'hot', 'cold', 'mild'],
    }],
    favorite: {
      type: Boolean,
      default: false,
    },
    imageUrl: {
      type: String,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    styleCategory: [{
      type: String,
      enum: ['casual', 'formal', 'business_casual', 'streetwear', 'vintage', 'bohemian', 'preppy', 'athletic', 'minimalist', 'other'],
    }],
    wearCount: {
      type: Number,
      default: 0,
    },
    lastWorn: {
      type: Date,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiPrompt: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

OutfitSchema.index({ ownerId: 1 });
OutfitSchema.index({ favorite: 1 });
OutfitSchema.index({ occasions: 1 });
OutfitSchema.index({ seasons: 1 });
OutfitSchema.index({ 'items.itemId': 1 });
OutfitSchema.index({ styleCategory: 1 });
OutfitSchema.index({ tags: 1 });

// Middleware để tự động tăng wearCount cho các items khi outfit được mặc
OutfitSchema.methods.markAsWorn = async function() {
  this.wearCount += 1;
  this.lastWorn = new Date();
  
  // Cập nhật các item trong outfit
  const Item = mongoose.model('Item');
  
  for (const item of this.items) {
    await Item.findByIdAndUpdate(item.itemId, {
      $inc: { wearCount: 1 },
      $set: { lastWorn: new Date() }
    });
  }
  
  return this.save();
};

module.exports = mongoose.model('Outfit', OutfitSchema); 