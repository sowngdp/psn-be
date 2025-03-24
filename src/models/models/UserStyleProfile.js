const mongoose = require('mongoose');

const UserStyleProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    bodyType: {
      type: String,
      enum: ['hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle', null],
      default: null,
    },
    seasonPreferences: {
      type: [String],
      enum: ['spring', 'summer', 'fall', 'winter'],
      default: [],
    },
    favoriteColors: {
      type: [String],
      default: [],
    },
    stylePreferences: {
      type: [String],
      default: [],
    },
    avoidPatterns: {
      type: [String],
      default: [],
    },
    measurements: {
      height: Number,
      weight: Number,
      bust: Number,
      waist: Number,
      hips: Number,
    },
    preferredOccasions: {
      type: [String],
      default: [],
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Tính toán % hoàn thành profile
UserStyleProfileSchema.pre('save', function (next) {
  let completedFields = 0;
  const totalFields = 6; // bodyType, seasonPreferences, favoriteColors, stylePreferences, measurements, preferredOccasions

  if (this.bodyType) completedFields++;
  if (this.seasonPreferences && this.seasonPreferences.length > 0) completedFields++;
  if (this.favoriteColors && this.favoriteColors.length > 0) completedFields++;
  if (this.stylePreferences && this.stylePreferences.length > 0) completedFields++;
  if (this.measurements && Object.keys(this.measurements).length > 0) completedFields++;
  if (this.preferredOccasions && this.preferredOccasions.length > 0) completedFields++;

  this.completionPercentage = Math.round((completedFields / totalFields) * 100);
  next();
});

module.exports = mongoose.model('UserStyleProfile', UserStyleProfileSchema); 