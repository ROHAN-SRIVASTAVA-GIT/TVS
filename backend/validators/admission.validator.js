const Joi = require('joi');

const admissionValidator = (data) => {
  const schema = Joi.object({
    studentName: Joi.string().max(255).required(),
    fatherName: Joi.string().max(255),
    fatherOccupation: Joi.string().max(100),
    fatherContact: Joi.string().pattern(/^[0-9]{10}$/),
    motherName: Joi.string().max(255),
    motherOccupation: Joi.string().max(100),
    motherContact: Joi.string().pattern(/^[0-9]{10}$/),
    whatsappContact: Joi.string().pattern(/^[0-9]{10}$/),
    email: Joi.string().email(),
    dateOfBirth: Joi.date().required(),
    gender: Joi.string().valid('Male', 'Female', 'Other'),
    religion: Joi.string(),
    caste: Joi.string(),
    aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/),
    bloodGroup: Joi.string().valid('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'),
    correspondingAddress: Joi.string(),
    correspondingDistrict: Joi.string(),
    correspondingPin: Joi.string().pattern(/^[0-9]{6}$/),
    correspondingState: Joi.string(),
    permanentAddress: Joi.string(),
    permanentDistrict: Joi.string(),
    permanentPin: Joi.string().pattern(/^[0-9]{6}$/),
    permanentState: Joi.string(),
    admissionClass: Joi.string().required(),
    academicYear: Joi.string().required()
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = {
  admissionValidator
};
