'use strict';

const ChatModel = require('../db/models/chat.model');
const openAIService = require('./openai.service');
const { BadRequestError, NotFoundError } = require('../core/error.response');

class ChatService {
    /**
     * Send a message and get AI response
     * @param {String} userId - The user's ID
     * @param {String} message - The user's message
     * @param {String} chatId - Optional chat ID for continuing conversation
     * @returns {Promise<Object>} The chat response
     */
    async sendMessage(userId, message, chatId = null) {
        try {
            let chat;

            if (chatId) {
                chat = await ChatModel.findById(chatId);
                if (!chat || chat.userId.toString() !== userId) {
                    throw new NotFoundError('Chat not found');
                }
            } else {
                chat = await ChatModel.createNewChat(userId);
            }

            // Add user's message
            await chat.addMessage('user', message);

            // Get previous messages for context (limit to last 10 messages)
            const contextMessages = chat.messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Add fashion stylist system prompt if it's a new chat
            if (chat.messages.length === 1) {
                contextMessages.unshift({
                    role: 'system',
                    content: 'You are a helpful fashion stylist assistant. Provide style advice, outfit suggestions, and fashion recommendations based on user preferences and context.'
                });
            }

            // Generate AI response
            const aiResponse = await openAIService.generateChatCompletion(contextMessages);

            // Save AI response
            await chat.addMessage('assistant', aiResponse.content);

            return {
                chatId: chat._id,
                message: aiResponse.content,
                timestamp: new Date()
            };
        } catch (error) {
            throw new BadRequestError(`Failed to process chat message: ${error.message}`);
        }
    }

    /**
     * Get chat history for a user
     * @param {String} userId - The user's ID
     * @param {Object} options - Query options (limit, offset)
     * @returns {Promise<Array>} Chat history
     */
    async getChatHistory(userId, options = { limit: 10, offset: 0 }) {
        try {
            const chats = await ChatModel.findActiveChats(userId)
                .skip(options.offset)
                .limit(options.limit)
                .select('-__v')
                .lean();

            return chats.map(chat => ({
                chatId: chat._id,
                messages: chat.messages,
                metadata: chat.metadata
            }));
        } catch (error) {
            throw new BadRequestError(`Failed to get chat history: ${error.message}`);
        }
    }

    /**
     * Clear chat history
     * @param {String} userId - The user's ID
     * @param {String} chatId - Optional specific chat to clear
     * @returns {Promise<Object>} Operation result
     */
    async clearHistory(userId, chatId = null) {
        try {
            if (chatId) {
                const chat = await ChatModel.findById(chatId);
                if (!chat || chat.userId.toString() !== userId) {
                    throw new NotFoundError('Chat not found');
                }
                await chat.clearHistory();
                return { success: true, message: 'Chat history cleared' };
            }

            // Clear all chats for the user
            await ChatModel.deleteMany({ userId });
            return { success: true, message: 'All chat history cleared' };
        } catch (error) {
            throw new BadRequestError(`Failed to clear chat history: ${error.message}`);
        }
    }

    /**
     * Get a specific chat by ID
     * @param {String} userId - The user's ID
     * @param {String} chatId - The chat ID
     * @returns {Promise<Object>} Chat details
     */
    async getChat(userId, chatId) {
        try {
            const chat = await ChatModel.findById(chatId).lean();
            if (!chat || chat.userId.toString() !== userId) {
                throw new NotFoundError('Chat not found');
            }

            return {
                chatId: chat._id,
                messages: chat.messages,
                metadata: chat.metadata
            };
        } catch (error) {
            throw new BadRequestError(`Failed to get chat: ${error.message}`);
        }
    }
}

// Create singleton instance
const chatService = new ChatService();

module.exports = chatService;
