const Gallery = require('../models/Gallery');
const logger = require('../config/logger');

class GalleryController {
  static async uploadImage(req, res) {
    try {
      logger.info('[Image Upload] Starting...', { 
        body: req.body, 
        hasFile: !!req.file,
        fileInfo: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      });

      const { title, description, category } = req.body;

      if (!title || !req.file) {
        return res.status(400).json({
          success: false,
          message: 'Title and image file are required'
        });
      }

      // Store image in DB
      const imageBuffer = req.file.buffer;
      const imageMimeType = req.file.mimetype || 'image/jpeg';
      const imageSize = req.file.size;

      const item = await Gallery.create({
        title,
        description,
        imageData: imageBuffer,
        imageMimeType,
        imageSize,
        category,
        uploadedBy: req.userId
      });

      logger.info(`[Image Upload] Success: ID ${item.id}, size: ${imageSize} bytes`);

      res.status(201).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          id: item.id,
          title: item.title,
          description: item.description,
          image_mime_type: item.image_mime_type,
          image_size: item.image_size,
          category: item.category,
          created_at: item.created_at
        }
      });
    } catch (error) {
      logger.error('[Image Upload] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image: ' + error.message
      });
    }
  }

  static async streamImage(req, res) {
    try {
      const { id } = req.params;
      logger.info(`[Stream Image] Request for ID: ${id}`);
      
      const imageData = await Gallery.getImageDataById(id);

      logger.info(`[Stream Image] DB result:`, {
        id,
        hasUrl: !!imageData?.image_url,
        hasData: !!imageData?.image_data,
        size: imageData?.image_size
      });

      // Check old format - filesystem URL
      if (imageData?.image_url) {
        logger.info(`[Stream Image] Redirecting to old file: ${imageData.image_url}`);
        return res.redirect(imageData.image_url);
      }

      // Check new format - database
      if (!imageData || !imageData.image_data) {
        logger.warn(`[Stream Image] Not found: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }

      const mimeType = imageData.image_mime_type || 'image/jpeg';
      const fileSize = imageData.image_size || imageData.image_data.length;

      res.set({
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'Content-Disposition': `inline; filename="image-${id}.jpg"`
      });

      res.send(imageData.image_data);
    } catch (error) {
      logger.error('[Stream Image] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream image'
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

      logger.info(`[Video Upload] Saving to DB: ${title}, buffer size: ${videoBuffer.length}, reported size: ${videoSize}`);

      const item = await Gallery.createVideo({
        title,
        description,
        videoBuffer,
        videoMimeType,
        videoSize,
        category,
        uploadedBy: req.userId
      });

      logger.info(`[Video Upload] Success: ID ${item.id}, stored size: ${item.video_size}`);

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
      const videoId = parseInt(id, 10);
      logger.info(`[Stream Video] ===========================================`);
      logger.info(`[Stream Video] Request for ID: ${id}, parsed: ${videoId}`);
      logger.info(`[Stream Video] Full URL: ${req.originalUrl}`);
      
      if (isNaN(videoId)) {
        logger.error(`[Stream Video] Invalid ID: ${id}`);
        return res.status(400).json({
          success: false,
          message: 'Invalid video ID'
        });
      }
      
      const videoData = await Gallery.getVideoDataById(videoId);
      
      logger.info(`[Stream Video] DB result:`, {
        id,
        hasData: !!videoData,
        hasVideoData: !!videoData?.video_data,
        videoDataSize: videoData?.video_data?.length,
        videoSize: videoData?.video_size,
        mimeType: videoData?.video_mime_type
      });

      if (!videoData || !videoData.video_data) {
        logger.warn(`[Stream Video] Video data not found for ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: 'Video not found'
        });
      }

      // Set headers for streaming
      const mimeType = videoData.video_mime_type || 'video/mp4';
      const fileSize = videoData.video_size || videoData.video_data.length;

      logger.info(`[Stream Video] Streaming: size=${fileSize}, type=${mimeType}`);

      res.set({
        'Content-Type': mimeType,
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="video-${id}.mp4"`
      });

      // Send video data
      res.send(videoData.video_data);
    } catch (error) {
      logger.error('[Stream Video] Error:', error);
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
