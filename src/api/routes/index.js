'use strict';

const express = require('express');
const router = express.Router();

// Import các routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const itemRoutes = require('./item.routes');
const outfitRoutes = require('./outfit.routes');
const styleRuleRoutes = require('./style-rule.routes');
const recommendationRoutes = require('./recommendation.routes');
const itemUploadRoutes = require('./item-upload.route');
const weatherRoutes = require('./weather.routes');

// Đăng ký routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/outfits', outfitRoutes);
router.use('/style-rules', styleRuleRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/item-uploads', itemUploadRoutes);
router.use('/weather', weatherRoutes);

module.exports = router;
