'use strict';

const Joi = require('joi');

/**
 * Xác thực thông tin đăng ký
 * @param {Object} data - Dữ liệu đăng ký
 * @returns {Object} - Kết quả xác thực
 */
const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required()
      .messages({
        'string.min': 'Tên phải có ít nhất 3 ký tự',
        'string.max': 'Tên không được vượt quá 50 ký tự',
        'any.required': 'Tên là trường bắt buộc'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email không đúng định dạng',
        'any.required': 'Email là trường bắt buộc'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là trường bắt buộc'
      })
  });

  return schema.validate(data);
};

/**
 * Xác thực thông tin đăng nhập
 * @param {Object} data - Dữ liệu đăng nhập
 * @returns {Object} - Kết quả xác thực
 */
const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email không đúng định dạng',
        'any.required': 'Email là trường bắt buộc'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Mật khẩu là trường bắt buộc'
      })
  });

  return schema.validate(data);
};

/**
 * Xác thực email
 * @param {Object} data - Dữ liệu chứa email
 * @returns {Object} - Kết quả xác thực
 */
const validateEmail = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email không đúng định dạng',
        'any.required': 'Email là trường bắt buộc'
      })
  });

  return schema.validate(data);
};

/**
 * Xác thực thông tin đặt lại mật khẩu
 * @param {Object} data - Dữ liệu đặt lại mật khẩu
 * @returns {Object} - Kết quả xác thực
 */
const validateResetPassword = (data) => {
  const schema = Joi.object({
    token: Joi.string().required()
      .messages({
        'any.required': 'Token là trường bắt buộc'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là trường bắt buộc'
      })
  });

  return schema.validate(data);
};

/**
 * Xác thực Google ID token
 * @param {Object} data - Dữ liệu chứa idToken
 * @returns {Object} - Kết quả xác thực
 */
const validateGoogleIdToken = (data) => {
  const schema = Joi.object({
    idToken: Joi.string().required()
      .messages({
        'any.required': 'ID token là trường bắt buộc'
      })
  });

  return schema.validate(data);
};

module.exports = {
  validateRegister,
  validateLogin,
  validateEmail,
  validateResetPassword,
  validateGoogleIdToken
}; 