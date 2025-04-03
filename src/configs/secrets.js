'use strict';

const AWS = require('aws-sdk');
const logger = require('../utils/logger');

class SecretsManager {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.secretsManager = new AWS.SecretsManager({
        region: process.env.AWS_REGION || 'ap-southeast-1'
      });
    } else {
      // Dev fallback
      this.secrets = {
        'jwt/access': 'dev-access-secret',
        'jwt/refresh': 'dev-refresh-secret'
      };
    }
  }

  async getSecret(secretName) {
    if (process.env.NODE_ENV !== 'production') {
      return this.secrets[secretName];
    }

    try {
      const data = await this.secretsManager.getSecretValue({
        SecretId: secretName
      }).promise();
      
      if ('SecretString' in data) {
        return data.SecretString;
      } else {
        const buff = Buffer.from(data.SecretBinary, 'base64');
        return buff.toString('ascii');
      }
    } catch (error) {
      logger.error(`Error retrieving secret ${secretName}:`, error);
      throw error;
    }
  }
}

const secretsManager = new SecretsManager();

module.exports = secretsManager; 