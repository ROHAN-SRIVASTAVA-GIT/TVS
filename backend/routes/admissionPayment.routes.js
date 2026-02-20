const express = require('express');
const router = express.Router();
const AdmissionPaymentController = require('../controllers/AdmissionPaymentController');

router.post('/create-payment', AdmissionPaymentController.createPayment);
router.get('/get-payment', AdmissionPaymentController.getPaymentByOrderId);
router.put('/update-payment-status', AdmissionPaymentController.updatePaymentStatus);

module.exports = router;
