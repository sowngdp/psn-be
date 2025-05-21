'use strict';

const express = require('express');
const router = express.Router();
const ChatController = require('../controllers/chat.controller');
const { authentication } = require('../middlewares/authentication');
const validator = require('../middlewares/validator');
const { body, query, param } = require('express-validator');

// Validation middleware
const validateMessage = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message cannot be empty')
        .isString()
        .withMessage('Message must be a string')
        .isLength({ max: 1000 })
        .withMessage('Message must not exceed 1000 characters'),
    body('chatId')
        .optional()
        .isMongoId()
        .withMessage('Invalid chat ID format'),
    validator
];

const validatePagination = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
    validator
];

const validateChatId = [
    param('chatId')
        .isMongoId()
        .withMessage('Invalid chat ID format'),
    validator
];

// Routes
router.use(authentication); // Apply authentication to all chat routes

// Send a message and get AI response
router.post('/message', ChatController.sendMessage);

// Get chat history with pagination
router.get('/history', ChatController.getChatHistory);

// Clear chat history (optional chatId query parameter)
router.delete('/history', ChatController.clearHistory);

// Get specific chat by ID
router.get('/:chatId', ChatController.getChat);

module.exports = router;
