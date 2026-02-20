const Contact = require('../models/Contact');
const { contactValidator } = require('../validators/contact.validator');
const logger = require('../config/logger');
const emailService = require('../utils/emailService');

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

      // Send notification to school admin
      try {
        const adminContent = `
          <div class="highlight-box" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 25px; border-radius: 15px; color: white;">
            <h3 style="margin: 0 0 15px 0; color: white;">📬 New Contact Form Submission</h3>
            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px;">
              <p style="margin: 8px 0; color: white;"><strong>Name:</strong> ${value.name}</p>
              <p style="margin: 8px 0; color: white;"><strong>Email:</strong> ${value.email}</p>
              <p style="margin: 8px 0; color: white;"><strong>Phone:</strong> ${value.phone || 'N/A'}</p>
              <p style="margin: 8px 0; color: white;"><strong>Subject:</strong> ${value.subject}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 10px; margin-top: 15px; color: #333;">
              <strong>Message:</strong><br/>
              ${value.message}
            </div>
            <p style="margin: 15px 0 0 0; color: white; font-size: 12px;">Submitted on: ${new Date().toLocaleString()}</p>
          </div>
        `;
        await emailService.sendEmail(
          process.env.SCHOOL_EMAIL || 'topviewpublicschool@gmail.com',
          `📬 New Contact Message - ${value.name}`,
          emailService.baseEmailTemplate(adminContent)
        );
      } catch (emailErr) {
        logger.error('Failed to send admin notification email:', emailErr);
      }

      // Send confirmation to user
      try {
        await emailService.sendContactConfirmation(value.email, value.name, value.subject);
      } catch (emailErr) {
        logger.error('Failed to send user confirmation email:', emailErr);
      }

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
