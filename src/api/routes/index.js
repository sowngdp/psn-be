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

// Đăng ký routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/outfits', outfitRoutes);
router.use('/style-rules', styleRuleRoutes);
router.use('/recommendations', recommendationRoutes);

module.exports = router;
