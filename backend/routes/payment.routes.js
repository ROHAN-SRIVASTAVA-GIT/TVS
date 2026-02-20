const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { auth } = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payments/');
  },
  filename: (req, file, cb) => {
    cb(null, `payment_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG and WebP are allowed'));
    }
  }
});

router.post('/create-order', sanitize, PaymentController.createOrder);
router.post('/verify', sanitize, PaymentController.verifyPayment);
router.post('/manual-submit', upload.single('screenshot'), PaymentController.manualPaymentSubmit);
router.post('/upload-proof', auth, upload.single('screenshot'), PaymentController.uploadPaymentProof);
router.get('/history', auth, PaymentController.getPaymentHistory);
router.get('/history/lookup', PaymentController.getPaymentHistoryByEmailOrPhone);
router.get('/all', auth, PaymentController.getAllPayments);
router.get('/receipt-new', PaymentController.generateQuickReceipt);
router.get('/receipt/:id', PaymentController.generateReceipt);
router.get('/:orderId', auth, PaymentController.getPaymentDetails);
router.get('/stats/all', auth, PaymentController.getPaymentStats);

module.exports = router;
