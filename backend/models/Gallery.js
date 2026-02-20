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
          image_url VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          uploaded_by INTEGER REFERENCES users(id),
          featured BOOLEAN DEFAULT false,
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery(featured)`);
      
      logger.info('Gallery table created successfully');
    } catch (error) {
      logger.error('Error creating gallery table:', error);
    }
  }

  static async create(galleryData) {
    const { title, description, imageUrl, category, uploadedBy } = galleryData;

    const query = `
      INSERT INTO gallery (title, description, image_url, category, uploaded_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [title, description, imageUrl, category, uploadedBy]);
      logger.info(`Gallery item created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating gallery item:', error);
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0) {
    const query = `
      SELECT * FROM gallery
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
    const query = 'SELECT * FROM gallery WHERE id = $1';
    
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
}

module.exports = Gallery;
