const { db } = require('../config/db');
const logger = require('../config/logger');

class Notice {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS notices (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          category VARCHAR(100),
          created_by INTEGER REFERENCES users(id),
          attachment_url VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          publish_date TIMESTAMP,
          expiry_date TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_notices_active ON notices(is_active)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_notices_category ON notices(category)`);
      
      logger.info('Notices table created successfully');
    } catch (error) {
      logger.error('Error creating notices table:', error);
    }
  }

  static async create(noticeData) {
    const { title, content, category, createdBy, attachmentUrl, publishDate, expiryDate } = noticeData;

    const query = `
      INSERT INTO notices (title, content, category, created_by, attachment_url, publish_date, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        title, content, category, createdBy, attachmentUrl, publishDate, expiryDate
      ]);
      logger.info(`Notice created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating notice:', error);
      throw error;
    }
  }

  static async getAll(limit = 20, offset = 0) {
    const query = `
      SELECT * FROM notices
      WHERE is_active = true AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
      ORDER BY publish_date DESC, created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    try {
      const result = await db.query(query, [limit, offset]);
      const countResult = await db.query(`
        SELECT COUNT(*) FROM notices 
        WHERE is_active = true AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
      `);
      
      return {
        notices: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error fetching notices:', error);
      throw error;
    }
  }

  static async getByCategory(category, limit = 10) {
    const query = `
      SELECT * FROM notices
      WHERE category = $1 AND is_active = true AND (expiry_date IS NULL OR expiry_date > CURRENT_TIMESTAMP)
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    try {
      const result = await db.query(query, [category, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching notices by category:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM notices WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding notice:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const { title, content, category, attachmentUrl, isActive } = updateData;

    const query = `
      UPDATE notices
      SET 
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        category = COALESCE($3, category),
        attachment_url = COALESCE($4, attachment_url),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    try {
      const result = await db.query(query, [title, content, category, attachmentUrl, isActive, id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating notice:', error);
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM notices WHERE id = $1 RETURNING id';
    
    try {
      const result = await db.query(query, [id]);
      logger.info(`Notice deleted: ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting notice:', error);
      throw error;
    }
  }
}

module.exports = Notice;
