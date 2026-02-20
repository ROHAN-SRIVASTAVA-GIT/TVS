const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

router.post('/register', sanitize, AuthController.register);
router.post('/login', sanitize, AuthController.login);
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, sanitize, AuthController.updateProfile);
router.post('/refresh-token', auth, AuthController.refreshToken);
router.post('/lookup-student', sanitize, AuthController.lookupStudent);

module.exports = router;
