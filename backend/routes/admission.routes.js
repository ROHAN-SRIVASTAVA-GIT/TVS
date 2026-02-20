const express = require('express');
const router = express.Router();
const AdmissionController = require('../controllers/admission.controller');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const sanitize = require('../middleware/sanitize');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10485760 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed'));
    }
  }
});

router.post('/submit', auth, sanitize, upload.single('photo'), AdmissionController.submitAdmission);
router.get('/my-admissions', auth, AdmissionController.getMyAdmissions);
router.get('/lookup', AdmissionController.getAdmissionByEmailOrPhone);
router.get('/:id', auth, AdmissionController.getAdmissionById);
router.put('/:id', auth, sanitize, AdmissionController.updateAdmission);

module.exports = router;
