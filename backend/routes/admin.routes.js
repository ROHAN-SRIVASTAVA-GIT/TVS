const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gallery/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10485760 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG and GIF are allowed'));
    }
  }
});

router.get('/dashboard/stats', auth, authorize('admin'), AdminController.getDashboardStats);

// Users
router.get('/users', auth, authorize('admin'), AdminController.getAllUsers);
router.post('/users', auth, authorize('admin'), AdminController.createUser);
router.put('/users/:id', auth, authorize('admin'), AdminController.updateUser);
router.put('/users/:id/status', auth, authorize('admin'), AdminController.updateUserStatus);
router.delete('/users/:id', auth, authorize('admin'), AdminController.deleteUser);

// Admissions
router.get('/admissions', auth, authorize('admin'), AdminController.getAllAdmissions);
router.get('/admissions/:id', auth, authorize('admin'), AdminController.getAdmissionById);
router.put('/admissions/:id/status', auth, authorize('admin'), AdminController.updateAdmissionStatus);
router.put('/admissions/:id', auth, authorize('admin'), AdminController.updateAdmission);
router.delete('/admissions/:id', auth, authorize('admin'), AdminController.deleteAdmission);

// Payments
router.get('/payments', auth, authorize('admin'), AdminController.getAllPayments);
router.get('/payments/phonepe', auth, authorize('admin'), AdminController.getPhonePePayments);
router.put('/payments/:id/status', auth, authorize('admin'), AdminController.updatePaymentStatus);
router.delete('/payments/:id', auth, authorize('admin'), AdminController.deletePayment);

// Contacts
router.get('/contacts', auth, authorize('admin'), AdminController.getAllContacts);
router.put('/contacts/:id/status', auth, authorize('admin'), AdminController.updateContactStatus);
router.delete('/contacts/:id', auth, authorize('admin'), AdminController.deleteContact);
router.post('/contacts/:id/reply', auth, authorize('admin'), AdminController.replyToContact);

// Notices
router.get('/notices', auth, authorize('admin'), AdminController.getAllNotices);
router.post('/notices', auth, authorize('admin'), AdminController.createNotice);
router.put('/notices/:id', auth, authorize('admin'), AdminController.updateNotice);
router.delete('/notices/:id', auth, authorize('admin'), AdminController.deleteNotice);

// Fee Structures
router.get('/fee-structures', auth, authorize('admin'), AdminController.getAllFeeStructures);
router.post('/fee-structures', auth, authorize('admin'), AdminController.createFeeStructure);
router.put('/fee-structures/:id', auth, authorize('admin'), AdminController.updateFeeStructure);
router.delete('/fee-structures/:id', auth, authorize('admin'), AdminController.deleteFeeStructure);

// Gallery
router.get('/gallery', auth, authorize('admin'), AdminController.getAllGallery);
router.post('/gallery', auth, authorize('admin'), upload.single('image'), AdminController.createGalleryItem);
router.delete('/gallery/:id', auth, authorize('admin'), AdminController.deleteGalleryItem);

// Students
router.get('/students', auth, authorize('admin'), AdminController.getAllStudents);
router.get('/students/:id', auth, authorize('admin'), AdminController.getStudentById);
router.post('/students', auth, authorize('admin'), AdminController.createStudent);
router.put('/students/:id', auth, authorize('admin'), AdminController.updateStudent);
router.delete('/students/:id', auth, authorize('admin'), AdminController.deleteStudent);

module.exports = router;
