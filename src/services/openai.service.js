'use strict';

const OpenAI = require('openai');
const { NotFoundError, BadRequestError } = require('../core/error.response');
const { OPENAI_API_KEY, OPENAI_MODEL, OPENAI_MAX_TOKENS, OPENAI_TEMPERATURE } = require('../configs/env');

class OpenAIService {
    constructor() {
        if (!OPENAI_API_KEY) {
            throw new Error('OpenAI API key is not configured');
        }

        this.openai = new OpenAI({
            apiKey: OPENAI_API_KEY
        });

        this.defaultConfig = {
            model: OPENAI_MODEL,
            max_tokens: OPENAI_MAX_TOKENS,
            temperature: OPENAI_TEMPERATURE
        };
    }

    /**
     * Generate a chat completion using OpenAI's API
     * @param {Array} messages Array of message objects with role and content
     * @param {Object} options Optional configuration overrides
     * @returns {Promise<Object>} The chat completion response
     * @throws {BadRequestError} If the request is invalid
     */
    async generateChatCompletion(messages, options = {}) {
        try {
            const response = await this.openai.chat.completions.create({
                ...this.defaultConfig,
                ...options,
                messages,
            });

            return response.choices[0].message;
        } catch (error) {
            throw new BadRequestError('Failed to generate chat completion: ' + error.message);
        }
    }

    /**
     * Generate outfit suggestions using OpenAI
     * @param {Object} params Parameters for outfit suggestion
     * @param {Object} params.stylePreferences User's style preferences
     * @param {String} params.occasion Occasion for the outfit
     * @param {Object} params.weather Weather conditions
     * @returns {Promise<Object>} Suggestions and reasoning
     */
    async generateOutfitSuggestions({ stylePreferences, occasion, weather }) {
        const prompt = {
            role: 'system',
            content: 'You are a personal fashion stylist assistant. Provide outfit suggestions based on the given preferences, occasion, and weather conditions.'
        };

        const userMessage = {
            role: 'user',
            content: `Please suggest an outfit for the following scenario:
        Style Preferences: ${JSON.stringify(stylePreferences)}
        Occasion: ${occasion}
        Weather: ${JSON.stringify(weather)}`
        };

        try {
            const response = await this.generateChatCompletion([prompt, userMessage], {
                temperature: 0.7 // Slightly creative but still consistent
            });

            return {
                suggestions: response.content,
                reasoning: 'Based on your style preferences, the occasion, and weather conditions'
            };
        } catch (error) {
            throw new BadRequestError('Failed to generate outfit suggestions: ' + error.message);
        }
    }

    /**
     * Generate style analysis and recommendations
     * @param {Object} userProfile User's style profile and preferences
     * @returns {Promise<Object>} Style analysis and recommendations
     */
    async generateStyleAnalysis(userProfile) {
        const prompt = {
            role: 'system',
            content: 'You are a fashion consultant specializing in personal style analysis. Provide detailed style recommendations based on the user\'s profile.'
        };

        const userMessage = {
            role: 'user',
            content: `Please analyze the style profile and provide recommendations:
        Profile: ${JSON.stringify(userProfile)}`
        };

        try {
            const response = await this.generateChatCompletion([prompt, userMessage], {
                temperature: 0.6 // More focused on consistent analysis
            });

            return {
                analysis: response.content,
                timestamp: new Date()
            };
        } catch (error) {
            throw new BadRequestError('Failed to generate style analysis: ' + error.message);
        }
    }
}

// Singleton instance
const openAIService = new OpenAIService();

module.exports = openAIService;
