const Joi = require('joi');

const contactValidator = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(255).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/),
    subject: Joi.string().max(255).required(),
    message: Joi.string().min(10).max(2000).required()
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  contactValidator
};
