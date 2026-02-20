const Joi = require('joi');

const registerValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).messages({
      'any.only': 'Passwords do not match'
    }),
    firstName: Joi.string().max(100).required(),
    lastName: Joi.string().max(100).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
      'string.pattern.base': 'Phone number must be 10 digits'
    }),
    role: Joi.string().valid('parent', 'student', 'teacher').default('parent')
  });

  return schema.validate(data, { abortEarly: false });
};

const loginValidator = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  return schema.validate(data, { abortEarly: false });
};

const updateProfileValidator = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    phone: Joi.string().pattern(/^[0-9]{10}$/)
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator
};
