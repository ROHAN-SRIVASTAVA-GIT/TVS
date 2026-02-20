const Contact = require('../models/Contact');
const { contactValidator } = require('../validators/contact.validator');
const logger = require('../config/logger');

class ContactController {
  static async submitContact(req, res) {
    try {
      const { error, value } = contactValidator(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(e => e.message)
        });
      }

      const contact = await Contact.create({
        name: value.name,
        email: value.email,
        phone: value.phone,
        subject: value.subject,
        message: value.message
      });

      logger.info(`Contact submission received: ${contact.id}`);

      res.status(201).json({
        success: true,
        message: 'Your message has been sent successfully. We will contact you soon.',
        data: contact
      });
    } catch (error) {
      logger.error('Contact submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit contact message'
      });
    }
  }

  static async getContacts(req, res) {
    try {
      const status = req.query.status;
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await Contact.getAll(status, limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contacts'
      });
    }
  }

  static async getContactById(req, res) {
    try {
      const { id } = req.params;
      const contact = await Contact.findById(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      res.status(200).json({
        success: true,
        data: contact
      });
    } catch (error) {
      logger.error('Fetch contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact'
      });
    }
  }

  static async updateContactStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, replyMessage } = req.body;

      const contact = await Contact.findById(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      const updated = await Contact.updateStatus(id, status, replyMessage);

      res.status(200).json({
        success: true,
        message: 'Contact status updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update contact status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update contact status'
      });
    }
  }

  static async deleteContact(req, res) {
    try {
      const { id } = req.params;
      const contact = await Contact.findById(id);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: 'Contact not found'
        });
      }

      await Contact.delete(id);

      res.status(200).json({
        success: true,
        message: 'Contact deleted successfully'
      });
    } catch (error) {
      logger.error('Delete contact error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete contact'
      });
    }
  }
}

module.exports = ContactController;
