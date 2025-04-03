'use strict';

const { validateRegister, validateLogin, validateEmail, validateResetPassword } = require('../../utils/validators');
const { BadRequestError } = require('../../core/error.response');

/**
 * Middleware validate đăng ký
 */
const register = (req, res, next) => {
  try {
    const { error } = validateRegister(req.body);
    if (error) throw new BadRequestError(error.details[0].message);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware validate đăng nhập
 */
const login = (req, res, next) => {
  try {
    const { error } = validateLogin(req.body);
    if (error) throw new BadRequestError(error.details[0].message);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware validate email
 */
const email = (req, res, next) => {
  try {
    const { error } = validateEmail(req.body);
    if (error) throw new BadRequestError(error.details[0].message);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware validate đặt lại mật khẩu
 */
const resetPassword = (req, res, next) => {
  try {
    const { error } = validateResetPassword(req.body);
    if (error) throw new BadRequestError(error.details[0].message);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  email,
  resetPassword
}; 