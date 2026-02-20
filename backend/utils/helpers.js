const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

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
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

const generateUUID = () => {
  return uuidv4();
};

const generateFormNumber = () => {
  return `FORM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const generateAdmissionNumber = () => {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `ADM${year}${random}`;
};

const generateReceiptNumber = () => {
  return `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 7).toUpperCase()}`;
};

const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const isValidPhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone.replace(/\D/g, ''));
};

const isValidAadhaar = (aadhaar) => {
  const re = /^[0-9]{12}$/;
  return re.test(aadhaar);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const calculateAge = (birthDate) => {
  const ageDiff = Date.now() - new Date(birthDate).getTime();
  const ageDate = new Date(ageDiff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const validatePasswordStrength = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
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
