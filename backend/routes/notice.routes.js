const express = require('express');
const router = express.Router();
const NoticeController = require('../controllers/notice.controller');
const { auth, authorize } = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

router.post('/', auth, authorize('admin'), sanitize, NoticeController.createNotice);
router.get('/', NoticeController.getNotices);
router.get('/category/:category', NoticeController.getNoticesByCategory);
router.get('/:id', NoticeController.getNoticeById);
router.put('/:id', auth, authorize('admin'), sanitize, NoticeController.updateNotice);
router.delete('/:id', auth, authorize('admin'), NoticeController.deleteNotice);

module.exports = router;
