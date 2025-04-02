'use strict';

const access.controller = require('./access.controller');
const auth.controller = require('./auth.controller');
const item.controller = require('./item.controller');
const outfit.controller = require('./outfit.controller');
const recommendation.controller = require('./recommendation.controller');
const styleRule.controller = require('./style-rule.controller');
const user.controller = require('./user.controller');

module.exports = {
  access.controller, 
  auth.controller, 
  item.controller, 
  outfit.controller, 
  recommendation.controller, 
  styleRule.controller, 
  user.controller, 
};
