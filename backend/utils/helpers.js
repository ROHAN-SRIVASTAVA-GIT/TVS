const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'tvs-default-secret-key-2026';

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw error;
  }
};

const comparePasswords = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw error;
  }
};

const generateToken = (payload, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  hashPassword,
  comparePasswords,
  generateToken,
  generateRefreshToken,
  verifyToken,
  generateUUID,
  generateFormNumber,
  generateAdmissionNumber,
  generateReceiptNumber,
  isValidEmail,
  isValidPhone,
  isValidAadhaar,
  formatDate,
  calculateAge,
  validatePasswordStrength
};
