const express = require('express');
const AccessController = require('../controllers/access.controller');
const { authentication } = require('../middlewares/authentication');
const router = express.Router();

// Routes không yêu cầu xác thực
router.post('/shop/signup', AccessController.signUp);
router.post('/shop/login', AccessController.login);
router.post('/shop/refresh-token', AccessController.refreshToken);

// Routes yêu cầu xác thực
router.use(authentication); // Apply middleware
router.post('/shop/logout', AccessController.logout);

module.exports = router; 