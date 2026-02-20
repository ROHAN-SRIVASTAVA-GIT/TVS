const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contact.controller');
const { auth, authorize } = require('../middleware/auth');
const sanitize = require('../middleware/sanitize');

router.post('/submit', sanitize, ContactController.submitContact);
router.get('/', auth, authorize('admin'), ContactController.getContacts);
router.get('/:id', auth, authorize('admin'), ContactController.getContactById);
router.put('/:id', auth, authorize('admin'), sanitize, ContactController.updateContactStatus);
router.delete('/:id', auth, authorize('admin'), ContactController.deleteContact);

module.exports = router;
