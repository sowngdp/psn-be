'use strict';

const access.service = require('./access.service');
const apiKey.service = require('./apiKey.service');
const item.service = require('./item.service');
const keyToken.service = require('./keyToken.service');
const outfit.service = require('./outfit.service');
const recommendation.service = require('./recommendation.service');
const styleRule.service = require('./style-rule.service');
const user.service = require('./user.service');

module.exports = {
  access.service, 
  apiKey.service, 
  item.service, 
  keyToken.service, 
  outfit.service, 
  recommendation.service, 
  styleRule.service, 
  user.service, 
};
