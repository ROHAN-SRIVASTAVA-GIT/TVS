const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { auth, authorize } = require('../middleware/auth');

router.get('/dashboard/stats', auth, authorize('admin'), AdminController.getDashboardStats);
router.get('/users', auth, authorize('admin'), AdminController.getAllUsers);
router.get('/admissions', auth, authorize('admin'), AdminController.getAllAdmissions);
router.put('/admissions/:id/status', auth, authorize('admin'), AdminController.updateAdmissionStatus);
router.get('/payments', auth, authorize('admin'), AdminController.getAllPayments);
router.get('/contacts', auth, authorize('admin'), AdminController.getAllContacts);
router.get('/notices', auth, authorize('admin'), AdminController.getAllNotices);

module.exports = router;
