const Notice = require('../models/Notice');
const logger = require('../config/logger');

class NoticeController {
  static async createNotice(req, res) {
    try {
      const { title, content, category, publishDate, expiryDate, attachmentUrl } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      const notice = await Notice.create({
        title,
        content,
        category,
        createdBy: req.userId,
        attachmentUrl,
        publishDate: publishDate || new Date(),
        expiryDate
      });

      logger.info(`Notice created: ${notice.id}`);

      res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        data: notice
      });
    } catch (error) {
      logger.error('Create notice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create notice'
      });
    }
  }

  static async getNotices(req, res) {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await Notice.getAll(limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch notices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notices'
      });
    }
  }

  static async getNoticesByCategory(req, res) {
    try {
      const { category } = req.params;
      const limit = req.query.limit || 10;

      const notices = await Notice.getByCategory(category, limit);

      res.status(200).json({
        success: true,
        data: notices
      });
    } catch (error) {
      logger.error('Fetch notices by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notices'
      });
    }
  }

  static async getNoticeById(req, res) {
    try {
      const { id } = req.params;
      const notice = await Notice.findById(id);

      if (!notice) {
        return res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
      }

      res.status(200).json({
        success: true,
        data: notice
      });
    } catch (error) {
      logger.error('Fetch notice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notice'
      });
    }
  }

  static async updateNotice(req, res) {
    try {
      const { id } = req.params;
      const notice = await Notice.findById(id);

      if (!notice) {
        return res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
      }

      const updated = await Notice.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Notice updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update notice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notice'
      });
    }
  }

  static async deleteNotice(req, res) {
    try {
      const { id } = req.params;
      const notice = await Notice.findById(id);

      if (!notice) {
        return res.status(404).json({
          success: false,
          message: 'Notice not found'
        });
      }

      await Notice.delete(id);

      res.status(200).json({
        success: true,
        message: 'Notice deleted successfully'
      });
    } catch (error) {
      logger.error('Delete notice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notice'
      });
    }
  }
}

module.exports = NoticeController;
