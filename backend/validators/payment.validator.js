const Joi = require('joi');

const paymentValidator = (data) => {
  const schema = Joi.object({
    studentId: Joi.number().allow(null, '').optional(),
    amount: Joi.number().positive().required(),
    feeType: Joi.string().valid('tuition', 'transport', 'uniform', 'exam', 'activity', 'other', 'admission').required(),
    className: Joi.string().required(),
    academicYear: Joi.string().required(),
    notes: Joi.string().max(500),
    studentName: Joi.string(),
    email: Joi.string().email(),
    phone: Joi.string()
  });

  return schema.validate(data, { abortEarly: false });
};

const paymentVerificationValidator = (data) => {
  const schema = Joi.object({
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().required(),
    razorpaySignature: Joi.string().required()
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  paymentValidator,
  paymentVerificationValidator
};
