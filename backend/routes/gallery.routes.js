const express = require('express');
const router = express.Router();
const GalleryController = require('../controllers/gallery.controller');
const { auth, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const logger = require('../config/logger');

// Use memory storage for images - stored in DB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10485760, // 10MB for images
    fieldSize: 10485760
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, JPG, GIF, WebP allowed'));
    }
  }
});

// Use memory storage for videos - stored in DB
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 104857600, // 100MB
    fieldSize: 104857600,
    fields: 100
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MPEG, MOV, WebM allowed'));
    }
  }
});

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error('[Multer Error]', err.code, err.message);
    return res.status(413).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  if (err) {
    logger.error('[Upload Error]', err.message);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

router.get('/', GalleryController.getGallery);
router.get('/category/:category', GalleryController.getByCategory);

// Image routes - stream from DB
router.post('/upload', auth, authorize('admin'), upload.single('image'), handleMulterError, GalleryController.uploadImage);
router.get('/:id/stream', GalleryController.streamImage);

// Video routes - stream from DB
router.post('/video/upload', auth, authorize('admin'), videoUpload.single('video'), handleMulterError, GalleryController.uploadVideo);
router.get('/video', GalleryController.getVideos);
router.get('/video/:id', GalleryController.getVideoById);
router.get('/video/:id/stream', GalleryController.streamVideo);
router.put('/video/:id', auth, authorize('admin'), GalleryController.updateVideo);
router.delete('/video/:id', auth, authorize('admin'), GalleryController.deleteVideo);

// Legacy image routes
router.get('/:id', GalleryController.getImageById);
router.put('/:id', auth, authorize('admin'), GalleryController.updateImage);
router.delete('/:id', auth, authorize('admin'), GalleryController.deleteImage);

module.exports = router;
