const { db } = require('../config/db');
const logger = require('../config/logger');

class Gallery {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS gallery (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          image_data TEXT,
          image_mime_type VARCHAR(100) DEFAULT 'image/jpeg',
          image_size INTEGER,
          category VARCHAR(100),
          uploaded_by INTEGER REFERENCES users(id),
          featured BOOLEAN DEFAULT false,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE TABLE IF NOT EXISTS gallery_videos (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        video_data TEXT,
        video_mime_type VARCHAR(100) DEFAULT 'video/mp4',
        video_size INTEGER,
        thumbnail TEXT,
        category VARCHAR(100),
        uploaded_by INTEGER REFERENCES users(id),
        featured BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery(featured)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_videos_category ON gallery_videos(category)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_videos_featured ON gallery_videos(featured)`);
      
      logger.info('Gallery tables created successfully');
    } catch (error) {
      logger.error('Error creating gallery table:', error);
    }
    
    // Add new columns to existing tables if they don't exist
    try {
      // Drop BYTEA column if exists and add TEXT column for base64 storage
      await db.query(`ALTER TABLE gallery DROP COLUMN IF EXISTS image_data`).catch(() => {});
      await db.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS image_data TEXT`).catch(() => {});
      await db.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS image_mime_type VARCHAR(100) DEFAULT 'image/jpeg'`).catch(() => {});
      await db.query(`ALTER TABLE gallery ADD COLUMN IF NOT EXISTS image_size INTEGER`).catch(() => {});
      logger.info('Gallery image columns updated to TEXT');
    } catch (error) {
      logger.error('Error updating gallery columns:', error);
    }
    
    // Add new columns to existing gallery_videos table if needed
    try {
      // Drop BYTEA column if exists and add TEXT column for base64 storage
      await db.query(`ALTER TABLE gallery_videos DROP COLUMN IF EXISTS video_data`).catch(() => {});
      await db.query(`ALTER TABLE gallery_videos ADD COLUMN IF NOT EXISTS video_data TEXT`).catch(() => {});
      await db.query(`ALTER TABLE gallery_videos ADD COLUMN IF NOT EXISTS video_mime_type VARCHAR(100) DEFAULT 'video/mp4'`).catch(() => {});
      await db.query(`ALTER TABLE gallery_videos ADD COLUMN IF NOT EXISTS video_size INTEGER`).catch(() => {});
      logger.info('Gallery video columns updated to TEXT');
    } catch (error) {
      logger.error('Error updating gallery video columns:', error);
    }
  }

  static async create(galleryData) {
    const { title, description, imageData, imageMimeType, imageSize, category, uploadedBy } = galleryData;

    // Convert buffer to base64 string for storage
    const imageBase64 = imageData ? imageData.toString('base64') : null;
    
    logger.info(`[DB] Creating image: title=${title}, bufferSize=${imageData?.length}, base64Length=${imageBase64?.length}`);

    const query = `
      INSERT INTO gallery (title, description, image_data, image_mime_type, image_size, category, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [title, description, imageBase64, imageMimeType || 'image/jpeg', imageSize, category, uploadedBy]);
      logger.info(`Gallery item created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating gallery item:', error);
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0) {
    const query = `
      SELECT id, title, description, image_mime_type, image_size, category, uploaded_by, featured, sort_order, created_at, updated_at
      FROM gallery
      ORDER BY featured DESC, sort_order ASC, created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await db.query(query, [limit, offset]);
      const countResult = await db.query('SELECT COUNT(*) FROM gallery');
      
      return {
        items: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error fetching gallery:', error);
      throw error;
    }
  }

  static async getImageDataById(id) {
    const query = 'SELECT image_data, image_mime_type, image_size FROM gallery WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      const row = result.rows[0];
      
      // Convert base64 back to buffer if stored as base64
      if (row && row.image_data && typeof row.image_data === 'string') {
        row.image_data = Buffer.from(row.image_data, 'base64');
      }
      
      return row;
    } catch (error) {
      logger.error('Error fetching image data:', error);
      throw error;
    }
  }

  static async getByCategory(category, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM gallery
      WHERE category = $1
      ORDER BY sort_order ASC, created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    try {
      const result = await db.query(query, [category, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching gallery by category:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT id, title, description, image_mime_type, image_size, category, uploaded_by, featured, sort_order, created_at, updated_at FROM gallery WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding gallery item:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const { title, description, category, featured, sortOrder } = updateData;

    const query = `
      UPDATE gallery
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        featured = COALESCE($4, featured),
        sort_order = COALESCE($5, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    try {
      const result = await db.query(query, [title, description, category, featured, sortOrder, id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating gallery item:', error);
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM gallery WHERE id = $1 RETURNING id';
    
    try {
      const result = await db.query(query, [id]);
      logger.info(`Gallery item deleted: ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting gallery item:', error);
      throw error;
    }
  }

  // Video methods - store binary data in DB as base64
  static async createVideo(videoData) {
    const { title, description, videoData: videoBuffer, videoMimeType, videoSize, thumbnail, category, uploadedBy } = videoData;

    // Convert buffer to base64 string for storage
    const videoBase64 = videoBuffer ? videoBuffer.toString('base64') : null;
    
    logger.info(`[DB] Creating video: title=${title}, bufferSize=${videoBuffer?.length}, base64Length=${videoBase64?.length}, mimeType=${videoMimeType}`);

    const query = `
      INSERT INTO gallery_videos (title, description, video_data, video_mime_type, video_size, thumbnail, category, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [title, description, videoBase64, videoMimeType || 'video/mp4', videoSize, thumbnail, category, uploadedBy]);
      logger.info(`Gallery video created: ${result.rows[0].id}, stored size: ${result.rows[0].video_size}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating gallery video:', error);
      throw error;
    }
  }

  static async getAllVideos(limit = 20, offset = 0) {
    const query = `
      SELECT id, title, description, video_url, video_mime_type, video_size, thumbnail, category, uploaded_by, featured, sort_order, created_at, updated_at
      FROM gallery_videos
      ORDER BY featured DESC, sort_order ASC, created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await db.query(query, [limit, offset]);
      const countResult = await db.query('SELECT COUNT(*) FROM gallery_videos');
      
      return {
        items: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error fetching gallery videos:', error);
      throw error;
    }
  }

  static async findVideoById(id) {
    const query = 'SELECT id, title, description, video_url, video_mime_type, video_size, thumbnail, category, uploaded_by, featured, sort_order, created_at, updated_at FROM gallery_videos WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding gallery video:', error);
      throw error;
    }
  }

  static async getVideoDataById(id) {
    logger.info(`[DB] getVideoDataById called with id:`, id, typeof id);
    const query = 'SELECT video_data, video_mime_type, video_size FROM gallery_videos WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      const row = result.rows[0];
      
      // Convert base64 back to buffer if stored as base64
      if (row && row.video_data && typeof row.video_data === 'string') {
        row.video_data = Buffer.from(row.video_data, 'base64');
        logger.info(`[DB] getVideoDataById: id=${id}, converted base64 to buffer, size=${row.video_data.length}`);
      }
      
      logger.info(`[DB] getVideoDataById: id=${id}, rowCount=${result.rowCount}, hasData=${!!row?.video_data}, type=${typeof row?.video_data}`);
      return row;
    } catch (error) {
      logger.error('Error fetching video data:', error);
      throw error;
    }
  }

  static async updateVideo(id, updateData) {
    const { title, description, videoData, videoMimeType, videoSize, thumbnail, category, featured, sortOrder } = updateData;

    const query = `
      UPDATE gallery_videos
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        video_data = COALESCE($3, video_data),
        video_mime_type = COALESCE($4, video_mime_type),
        video_size = COALESCE($5, video_size),
        thumbnail = COALESCE($6, thumbnail),
        category = COALESCE($7, category),
        featured = COALESCE($8, featured),
        sort_order = COALESCE($9, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    try {
      const result = await db.query(query, [title, description, videoData, videoMimeType, videoSize, thumbnail, category, featured, sortOrder, id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating gallery video:', error);
      throw error;
    }
  }

  static async deleteVideo(id) {
    const query = 'DELETE FROM gallery_videos WHERE id = $1 RETURNING id';
    
    try {
      const result = await db.query(query, [id]);
      logger.info(`Gallery video deleted: ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting gallery video:', error);
      throw error;
    }
  }
}

module.exports = Gallery;
