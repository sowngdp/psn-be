'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

const DOCUMENT_NAME = 'user';
const COLLECTION_NAME = 'users';

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  roles: {
    type: [String],
    default: ['USER']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    favoriteColors: [String],
    favoriteStyles: [String],
    favoriteCategories: [String],
    dislikedColors: [String],
    dislikedPatterns: [String],
    dislikedMaterials: [String],
    seasonPreference: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all'],
      default: 'all'
    },
    weatherPreferences: {
      preferLayeredOutfits: {
        type: Boolean, 
        default: false
      },
      preferWarmOutfits: {
        type: Boolean,
        default: false
      },
      preferBreathableOutfits: {
        type: Boolean,
        default: false
      }
    },
    occasionPreferences: {
      type: Map,
      of: {
        priority: {
          type: Number,
          min: 1,
          max: 5,
          default: 3
        },
        preferredStyles: [String]
      },
      default: new Map()
    },
    clothingFit: {
      type: String,
      enum: ['loose', 'regular', 'tight', 'any'],
      default: 'any'
    }
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  passwordResetLastAttempt: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: COLLECTION_NAME
});

// Phương thức so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords');
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
};

// Phương thức cập nhật preferences
userSchema.methods.updatePreferences = async function(preferencesData) {
  // Cập nhật các mảng
  if (preferencesData.favoriteColors) this.preferences.favoriteColors = preferencesData.favoriteColors;
  if (preferencesData.favoriteStyles) this.preferences.favoriteStyles = preferencesData.favoriteStyles;
  if (preferencesData.favoriteCategories) this.preferences.favoriteCategories = preferencesData.favoriteCategories;
  if (preferencesData.dislikedColors) this.preferences.dislikedColors = preferencesData.dislikedColors;
  if (preferencesData.dislikedPatterns) this.preferences.dislikedPatterns = preferencesData.dislikedPatterns;
  if (preferencesData.dislikedMaterials) this.preferences.dislikedMaterials = preferencesData.dislikedMaterials;
  
  // Cập nhật các giá trị đơn lẻ
  if (preferencesData.seasonPreference) this.preferences.seasonPreference = preferencesData.seasonPreference;
  if (preferencesData.clothingFit) this.preferences.clothingFit = preferencesData.clothingFit;
  
  // Cập nhật weatherPreferences nếu có
  if (preferencesData.weatherPreferences) {
    this.preferences.weatherPreferences = {
      ...this.preferences.weatherPreferences,
      ...preferencesData.weatherPreferences
    };
  }
  
  // Cập nhật occasionPreferences nếu có
  if (preferencesData.occasionPreferences) {
    // Chuyển đổi từ object sang Map nếu cần
    const occasionPrefs = preferencesData.occasionPreferences;
    for (const [occasion, prefs] of Object.entries(occasionPrefs)) {
      this.preferences.occasionPreferences.set(occasion, prefs);
    }
  }
  
  return this.save();
};

// Phương thức lấy recommendations dựa trên preferences
userSchema.methods.getPreferenceBasedRecommendations = function() {
  const { favoriteColors, favoriteStyles, seasonPreference } = this.preferences;
  
  const recommendationCriteria = {
    colors: favoriteColors || [],
    styles: favoriteStyles || [],
    season: seasonPreference || 'all'
  };
  
  return recommendationCriteria;
};

// Middleware hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model(DOCUMENT_NAME, userSchema); 
