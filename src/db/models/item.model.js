'use strict';

const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true
    },
    subCategory: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      trim: true,
      index: true
    },
    pattern: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    size: {
      type: String,
      trim: true
    },
    material: {
      type: String,
      trim: true
    },
    season: {
      type: String,
      enum: {
        values: ['spring', 'summer', 'fall', 'winter', 'all'],
        message: '{VALUE} is not a valid season'
      },
      default: 'all',
      index: true
    },
    occasion: {
      type: [String],
      validate: {
        validator: function(array) {
          return array && array.length <= 10;
        },
        message: 'Occasions cannot exceed 10 items'
      }
    },
    style: {
      type: [String],
      validate: {
        validator: function(array) {
          return array && array.length <= 10;
        },
        message: 'Styles cannot exceed 10 items'
      },
      index: true
    },
    attributes: {
      type: [String],
      validate: {
        validator: function(array) {
          return array && array.length <= 20;
        },
        message: 'Attributes cannot exceed 20 items'
      }
    },
    purchaseInfo: {
      date: Date,
      price: {
        type: Number,
        min: [0, 'Price cannot be negative']
      },
      location: String,
      currency: {
        type: String,
        default: 'VND'
      }
    },
    care: {
      washInstructions: String,
      dryInstructions: String,
      ironInstructions: String,
    },
    tags: {
      type: [String],
      validate: {
        validator: function(array) {
          return array && array.length <= 20;
        },
        message: 'Tags cannot exceed 20 items'
      },
      index: true
    },
    positions: {
      type: String,
      default: 'middle-right'
    },
    images: [{
      url: {
        type: String,
        required: true
      },
      isMain: {
        type: Boolean,
        default: false
      },
      backgroundRemoved: {
        type: Boolean,
        default: false
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    // For backward compatibility
    imageUrl: {
      type: String,
    },
    backgroundRemoved: {
      type: Boolean,
      default: false,
    },
    inCloset: {
      type: Boolean,
      default: true,
      index: true
    },
    condition: {
      type: String,
      enum: {
        values: ['new', 'like new', 'good', 'fair', 'poor'],
        message: '{VALUE} is not a valid condition'
      },
      default: 'good'
    },
    wearCount: {
      type: Number,
      default: 0,
      min: [0, 'Wear count cannot be negative']
    },
    lastWorn: {
      type: Date,
    },
    wearHistory: [{
      date: {
        type: Date,
        required: true
      },
      outfitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Outfit'
      },
      weather: {
        type: String
      },
      notes: String
    }],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    meta: {
      aiTags: [String],
      colors: [String],
      confidence: Number,
      analytics: {
        seasonUsage: {
          spring: { type: Number, default: 0 },
          summer: { type: Number, default: 0 },
          fall: { type: Number, default: 0 },
          winter: { type: Number, default: 0 }
        }
      }
    },
    embedText: {
      type: String,
      trim: true,
    },
    embedding: {
      type: [Number],
      message: 'Embedding must be an array of 1536 numbers'
    }

  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual fields
ItemSchema.virtual('ageInDays').get(function() {
  if (!this.createdAt) return null;
  const diffTime = Math.abs(new Date() - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

ItemSchema.virtual('daysSinceLastWorn').get(function() {
  if (!this.lastWorn) return null;
  const diffTime = Math.abs(new Date() - this.lastWorn);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

ItemSchema.virtual('usageFrequency').get(function() {
  if (!this.createdAt || this.wearCount === 0) return 0;
  const ageInDays = this.ageInDays;
  return ageInDays > 0 ? (this.wearCount / ageInDays) * 30 : 0; // Monthly usage
});

ItemSchema.virtual('mainImage').get(function() {
  if (this.images && this.images.length > 0) {
    const mainImage = this.images.find(img => img.isMain);
    return mainImage ? mainImage.url : this.images[0].url;
  }
  return this.imageUrl; // Fallback to legacy field
});

// Methods
ItemSchema.methods.incrementWearCount = function() {
  this.wearCount += 1;
  this.lastWorn = new Date();
  return this.save();
};

ItemSchema.methods.addWearHistory = function(data) {
  if (!this.wearHistory) this.wearHistory = [];
  this.wearHistory.push({
    date: data.date || new Date(),
    outfitId: data.outfitId,
    weather: data.weather,
    notes: data.notes
  });
  return this.save();
};

// Indexes (moved inside the schema definition for better organization)
// Additional compound indexes for common query patterns
ItemSchema.index({ ownerId: 1, category: 1 });
ItemSchema.index({ ownerId: 1, inCloset: 1 });
ItemSchema.index({ ownerId: 1, lastWorn: -1 });
ItemSchema.index({ ownerId: 1, wearCount: -1 });
ItemSchema.index({ ownerId: 1, 'meta.aiTags': 1 });

// Pre-save middleware to ensure at least one image is marked as main
ItemSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const hasMainImage = this.images.some(img => img.isMain);
    if (!hasMainImage) {
      this.images[0].isMain = true;
    }
  }
  next();
});

module.exports = mongoose.model('Item', ItemSchema); 
