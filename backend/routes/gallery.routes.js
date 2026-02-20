const express = require('express');
const router = express.Router();
const GalleryController = require('../controllers/gallery.controller');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

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
      cb(new Error('Invalid file type'));
    }
  }
});

router.post('/upload', auth, authorize('admin'), upload.single('image'), GalleryController.uploadImage);
router.get('/', GalleryController.getGallery);
router.get('/category/:category', GalleryController.getByCategory);
router.get('/:id', GalleryController.getImageById);
router.put('/:id', auth, authorize('admin'), GalleryController.updateImage);
router.delete('/:id', auth, authorize('admin'), GalleryController.deleteImage);

module.exports = router;
