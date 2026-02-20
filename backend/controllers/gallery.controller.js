const Gallery = require('../models/Gallery');
const logger = require('../config/logger');

class GalleryController {
  static async uploadImage(req, res) {
    try {
      const { title, description, category } = req.body;

      if (!title || !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Title and image file are required'
        });
      }

      const item = await Gallery.create({
        title,
        description,
        imageUrl: `/uploads/${req.file.filename}`,
        category,
        uploadedBy: req.userId
      });

      logger.info(`Gallery image uploaded: ${item.id}`);

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: item
      });
    } catch (error) {
      logger.error('Upload image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image'
      });
    }
  }

  static async getGallery(req, res) {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await Gallery.getAll(limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch gallery error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gallery'
      });
    }
  }

  static async getByCategory(req, res) {
    try {
      const { category } = req.params;
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const items = await Gallery.getByCategory(category, limit, offset);

      res.status(200).json({
        success: true,
        data: items
      });
    } catch (error) {
      logger.error('Fetch gallery by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gallery'
      });
    }
  }

  static async getImageById(req, res) {
    try {
      const { id } = req.params;
      const item = await Gallery.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }

      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      logger.error('Fetch image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch image'
      });
    }
  }

  static async updateImage(req, res) {
    try {
      const { id } = req.params;
      const item = await Gallery.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }

      const updated = await Gallery.update(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Image updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update image'
      });
    }
  }

  static async deleteImage(req, res) {
    try {
      const { id } = req.params;
      const item = await Gallery.findById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }

      await Gallery.delete(id);

      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      logger.error('Delete image error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image'
      });
    }
  }
}

module.exports = GalleryController;
