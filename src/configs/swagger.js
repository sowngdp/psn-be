'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const { PORT } = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Personal Style Network API',
      version: '1.0.0',
      description: 'API Documentation cho Personal Style Network',
      contact: {
        name: 'PSN Team',
        email: 'support@psn.dev'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `/v1/api`,
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    './src/api/routes/**/*.js',
    './src/api/models/**/*.js',
    './src/db/models/**/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 
