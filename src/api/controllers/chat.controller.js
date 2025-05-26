'use strict';

const { OK, CREATED } = require('../../core/success.response');
const chatService = require('../../services/chat.service');

class ChatController {
    /**
     * Send a message and get AI response
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async sendMessage(req, res, next) {
        try {
            const userId = req.user.userId;
            const { message, chatId } = req.body;

            const response = await chatService.sendMessage(userId, message, chatId);
            new CREATED({
                message: 'Message sent successfully',
                metadata: response
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get chat history for the authenticated user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async getChatHistory(req, res, next) {
        try {
            const userId = req.user.userId;
            const { limit = 10, offset = 0 } = req.query;

            const history = await chatService.getChatHistory(userId, {
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            new OK({
                message: 'Chat history retrieved successfully',
                metadata: history
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Clear chat history
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async clearHistory(req, res, next) {
        try {
            const userId = req.user.userId;
            const { chatId } = req.query;

            const result = await chatService.clearHistory(userId, chatId);
            new OK({
                message: result.message,
                metadata: result
            }).send(res);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a specific chat by ID
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    static async getChat(req, res, next) {
        try {
            const userId = req.user.userId;
            const { chatId } = req.params;

            const chat = await chatService.getChat(userId, chatId);
            new OK({
                message: 'Chat retrieved successfully',
                metadata: chat
            }).send(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ChatController;
