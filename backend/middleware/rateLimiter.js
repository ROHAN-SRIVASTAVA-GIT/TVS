const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts, please try again later',
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'API rate limit exceeded',
});

const paymentVerifyLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: 'Payment verification rate limit exceeded, please wait',
  skipFailedRequests: false,
});

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  apiLimiter,
  paymentVerifyLimiter,
};
