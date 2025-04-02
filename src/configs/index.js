'use strict';

const config.bucket = require('./config.bucket');
const config.firebase = require('./config.firebase');
const config.mongodb = require('./config.mongodb');
const db = require('./db');
const env = require('./env');
const swagger = require('./swagger');

module.exports = {
  config.bucket, 
  config.firebase, 
  config.mongodb, 
  db, 
  env, 
  swagger, 
};
