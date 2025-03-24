'use strict';

const apiKeyModel = require("../models/apiKey.model");
const crypto = require('crypto');

class ApiKeyService {
    static async findByKey(key) {
        try {
            const objKey = await apiKeyModel.findOne({ key, status: true }).lean();
            return objKey;
        } catch (error) {
            return null;
        }
    }
    
    static async generateKey() {
        try {
            const key = crypto.randomBytes(32).toString('hex');
            return key;
        } catch (error) {
            return null;
        }
    }

    static async createKey(permissions) {
        try {
            const key = await this.generateKey();
            const apiKey = await apiKeyModel.create({
                key,
                permissions
            });
            return apiKey ? apiKey.key : null;
        } catch (error) {
            return null;
        }
    }
};

module.exports = ApiKeyService;