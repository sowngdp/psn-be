'use strict';

const mongoose = require('mongoose');

const OutfitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Outfit name is required'],
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
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true,
        },
        position: {
          type: String,
          enum: {
            values: ['top', 'bottom', 'outer', 'accessory', 'footwear', 'other'],
            message: '{VALUE} is not a valid position'
          },
          required: [true, 'Item position is required']
        },
        layerOrder: {
          type: Number,
          default: 0
        },
        notes: String,
        isVisible: {
          type: Boolean,
          default: true
        },
        coordinates: {
          x: Number,
          y: Number,
          scale: Number,
          rotation: Number
        }
      },
    ],
    season: {
      type: String,
      enum: {
        values: ['spring', 'summer', 'fall', 'winter', 'all'],
        message: '{VALUE} is not a valid season'
      },
      default: 'all',
      index: true
    },
    weather: {
      type: [String],
      enum: {
        values: ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'hot', 'cold', 'mild', 'any'],
        message: '{VALUE} is not a valid weather condition'
      },
      default: ['any']
    },
    occasion: {
      type: String,
      trim: true,
      index: true
    },
    styleTypes: {
      type: [String],
      validate: {
        validator: function(array) {
          return array && array.length <= 10;
        },
        message: 'Style types cannot exceed 10 items'
      }
    },
    styleScore: {
      type: Number,
      min: 0,
      max: 10,
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
    inCloset: {
      type: Boolean,
      default: true,
      index: true
    },
    wearCount: {
      type: Number,
      default: 0,
      min: [0, 'Wear count cannot be negative']
    },
    lastWorn: {
      type: Date,
      index: true
    },
    wearHistory: [
      {
        date: {
          type: Date,
          required: true
        },
        occasion: {
          type: String,
        },
        weather: {
          type: String,
        },
        temperature: {
          type: Number
        },
        location: {
          type: String
        },
        notes: {
          type: String,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        }
      },
    ],
    images: [{
      url: {
        type: String,
        required: true
      },
      isMain: {
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
    isFavorite: {
      type: Boolean,
      default: false,
    },
    meta: {
      generatedBy: {
        type: String,
        enum: ['user', 'ai', 'community'],
        default: 'user'
      },
      aiTags: [String],
      compatibility: {
        type: Number,
        min: 0,
        max: 100
      },
      analytics: {
        seasonUsage: {
          spring: { type: Number, default: 0 },
          summer: { type: Number, default: 0 },
          fall: { type: Number, default: 0 },
          winter: { type: Number, default: 0 }
        },
        averageRating: { type: Number, default: 0 }
      }
    },
    isShared: {
      type: Boolean,
      default: false
    },
    shareSettings: {
      isPublic: {
        type: Boolean,
        default: false
      },
      allowComments: {
        type: Boolean,
        default: true
      },
      sharedWith: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view'
        }
      }]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual fields
OutfitSchema.virtual('itemCount').get(function() {
  return this.items ? this.items.length : 0;
});

OutfitSchema.virtual('daysSinceLastWorn').get(function() {
  if (!this.lastWorn) return null;
  const diffTime = Math.abs(new Date() - this.lastWorn);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

OutfitSchema.virtual('usageFrequency').get(function() {
  if (!this.createdAt || this.wearCount === 0) return 0;
  const diffTime = Math.abs(new Date() - this.createdAt);
  const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return ageInDays > 0 ? (this.wearCount / ageInDays) * 30 : 0; // Monthly usage
});

OutfitSchema.virtual('mainImage').get(function() {
  if (this.images && this.images.length > 0) {
    const mainImage = this.images.find(img => img.isMain);
    return mainImage ? mainImage.url : this.images[0].url;
  }
  return this.imageUrl; // Fallback to legacy field
});

// Methods
OutfitSchema.methods.incrementWearCount = function() {
  this.wearCount += 1;
  this.lastWorn = new Date();
  return this.save();
};

OutfitSchema.methods.addWearHistory = function(data) {
  this.wearHistory.push({
    date: data.date || new Date(),
    occasion: data.occasion,
    weather: data.weather,
    temperature: data.temperature,
    location: data.location,
    notes: data.notes,
    rating: data.rating
  });
  
  // Update average rating
  if (data.rating) {
    const totalRatings = this.wearHistory.filter(h => h.rating).length;
    const ratingSum = this.wearHistory.reduce((sum, h) => sum + (h.rating || 0), 0);
    if (totalRatings > 0) {
      if (!this.meta) this.meta = {};
      if (!this.meta.analytics) this.meta.analytics = {};
      this.meta.analytics.averageRating = ratingSum / totalRatings;
    }
  }
  
  return this.save();
};

// Update season usage when worn
OutfitSchema.methods.updateSeasonUsage = function(season) {
  if (!season) return this;
  
  if (!this.meta) this.meta = {};
  if (!this.meta.analytics) this.meta.analytics = {};
  if (!this.meta.analytics.seasonUsage) {
    this.meta.analytics.seasonUsage = {
      spring: 0,
      summer: 0,
      fall: 0,
      winter: 0
    };
  }
  
  // Increment the appropriate season
  if (['spring', 'summer', 'fall', 'winter'].includes(season)) {
    this.meta.analytics.seasonUsage[season] += 1;
  }
  
  return this;
};

// Indexes (moved inside the schema definition for better organization)
// Additional compound indexes for common query patterns
OutfitSchema.index({ ownerId: 1, inCloset: 1 });
OutfitSchema.index({ ownerId: 1, lastWorn: -1 });
OutfitSchema.index({ ownerId: 1, wearCount: -1 });
OutfitSchema.index({ ownerId: 1, season: 1 });
OutfitSchema.index({ ownerId: 1, occasion: 1 });
OutfitSchema.index({ 'shareSettings.isPublic': 1 });
OutfitSchema.index({ 'shareSettings.sharedWith.userId': 1 });

// Pre-save middleware to ensure at least one image is marked as main
OutfitSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const hasMainImage = this.images.some(img => img.isMain);
    if (!hasMainImage) {
      this.images[0].isMain = true;
    }
  }
  next();
});

module.exports = mongoose.model('Outfit', OutfitSchema); 
