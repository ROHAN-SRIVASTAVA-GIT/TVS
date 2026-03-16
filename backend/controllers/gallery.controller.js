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

  // Video methods - store in database
  static async uploadVideo(req, res) {
    try {
      logger.info('[Video Upload] Starting upload...', { 
        body: req.body, 
        hasFile: !!req.file,
        fileInfo: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      });

      const { title, description, category } = req.body;

      if (!title) {
        logger.warn('[Video Upload] Missing title');
        return res.status(400).json({
          success: false,
          message: 'Title is required'
        });
      }

      if (!req.file) {
        logger.warn('[Video Upload] Missing video file');
        return res.status(400).json({
          success: false,
          message: 'Video file is required'
        });
      }

      // Read file buffer
      const videoBuffer = req.file.buffer;
      const videoMimeType = req.file.mimetype || 'video/mp4';
      const videoSize = req.file.size;

      logger.info(`[Video Upload] Saving to DB: ${title}, size: ${videoSize} bytes`);

      const item = await Gallery.createVideo({
        title,
        description,
        videoBuffer,
        videoMimeType,
        videoSize,
        category,
        uploadedBy: req.userId
      });

      logger.info(`[Video Upload] Success: ID ${item.id}, size: ${videoSize} bytes`);

      res.status(201).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          id: item.id,
          title: item.title,
          description: item.description,
          video_mime_type: item.video_mime_type,
          video_size: item.video_size,
          thumbnail: item.thumbnail,
          category: item.category,
          created_at: item.created_at
        }
      });
    } catch (error) {
      logger.error('[Video Upload] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload video: ' + error.message
      });
    }
  }

  static async streamVideo(req, res) {
    try {
      const { id } = req.params;
      
      const videoData = await Gallery.getVideoDataById(id);

      if (!videoData || !videoData.video_data) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Set headers for streaming
      const mimeType = videoData.video_mime_type || 'video/mp4';
      const fileSize = videoData.video_size || videoData.video_data.length;

      res.set({
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="video-${id}.mp4"`
      });

      // Send video data
      res.send(videoData.video_data);
    } catch (error) {
      logger.error('Stream video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream video'
      });
    }
  }

  static async getVideos(req, res) {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await Gallery.getAllVideos(limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch videos error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch videos'
      });
    }
  }

  static async getVideoById(req, res) {
    try {
      const { id } = req.params;
      const item = await Gallery.findVideoById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Return video info without binary data
      res.status(200).json({
        success: true,
        data: {
          id: item.id,
          title: item.title,
          description: item.description,
          video_mime_type: item.video_mime_type,
          video_size: item.video_size,
          thumbnail: item.thumbnail,
          category: item.category,
          created_at: item.created_at
        }
      });
    } catch (error) {
      logger.error('Fetch video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch video'
      });
    }
  }

  static async updateVideo(req, res) {
    try {
      const { id } = req.params;
      const item = await Gallery.findVideoById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      const updated = await Gallery.updateVideo(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Video updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update video'
      });
    }
  }

  static async deleteVideo(req, res) {
    try {
      const { id } = req.params;
      const item = await Gallery.findVideoById(id);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      await Gallery.deleteVideo(id);

      res.status(200).json({
        success: true,
        message: 'Video deleted successfully'
      });
    } catch (error) {
      logger.error('Delete video error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete video'
      });
    }
  }
}

module.exports = GalleryController;
