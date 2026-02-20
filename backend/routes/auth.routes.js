const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

// OTP endpoints (public) - for verification everywhere
router.post('/otp/send', sanitize, AuthController.sendOTP);
router.post('/otp/verify', sanitize, AuthController.verifyOTP);

// Registration with OTP verification
router.post('/register', sanitize, AuthController.register);

// Login with password or OTP
router.post('/login', sanitize, AuthController.login);

// Existing routes
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, sanitize, AuthController.updateProfile);
router.post('/refresh-token', auth, AuthController.refreshToken);
router.post('/lookup-student', sanitize, AuthController.lookupStudent);

module.exports = router;
