const express = require('express');
const router = express.Router();
const OTPController = require('../controllers/otp.controller');
const sanitize = require('../middleware/sanitize');

router.post('/send', sanitize, OTPController.sendOTP);
router.post('/verify', sanitize, OTPController.verifyOTP);
router.post('/resend', sanitize, OTPController.resendOTP);

module.exports = router;
