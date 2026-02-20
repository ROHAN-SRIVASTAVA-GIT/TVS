const express = require('express');
const router = express.Router();
const FeeController = require('../controllers/fee.controller');
const { auth, authorize } = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

router.post('/structure', auth, authorize('admin'), sanitize, FeeController.createFeeStructure);
router.get('/structures', FeeController.getFeeStructures);
router.get('/class/:className', FeeController.getFeeByClass);
router.put('/structure/:id', auth, authorize('admin'), sanitize, FeeController.updateFeeStructure);
router.get('/classes', FeeController.getClassList);

module.exports = router;
