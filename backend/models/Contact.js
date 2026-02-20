const { db } = require('../config/db');
const logger = require('../config/logger');

class Contact {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          subject VARCHAR(255),
          message TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'new',
          replied BOOLEAN DEFAULT false,
          replied_at TIMESTAMP,
          reply_message TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`);
      
      logger.info('Contacts table created successfully');
    } catch (error) {
      logger.error('Error creating contacts table:', error);
    }
  }

  static async create(contactData) {
    const { name, email, phone, subject, message } = contactData;

    const query = `
      INSERT INTO contacts (name, email, phone, subject, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [name, email, phone, subject, message]);
      logger.info(`Contact submission created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating contact:', error);
      throw error;
    }
  }

  static async getAll(status = null, limit = 20, offset = 0) {
    let query = 'SELECT * FROM contacts';
    const params = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
    }

    try {
      const result = await db.query(query, params);
      const countQuery = status 
        ? `SELECT COUNT(*) FROM contacts WHERE status = $1`
        : `SELECT COUNT(*) FROM contacts`;
      const countParams = status ? [status] : [];
      const countResult = await db.query(countQuery, countParams);

      return {
        contacts: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error fetching contacts:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM contacts WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding contact:', error);
      throw error;
    }
  }

  static async updateStatus(id, status, replyMessage = null) {
    const query = `
      UPDATE contacts
      SET 
        status = $1,
        replied = true,
        replied_at = CURRENT_TIMESTAMP,
        reply_message = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [status, replyMessage, id]);
      logger.info(`Contact ${id} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating contact status:', error);
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM contacts WHERE id = $1 RETURNING id';
    
    try {
      const result = await db.query(query, [id]);
      logger.info(`Contact deleted: ${id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting contact:', error);
      throw error;
    }
  }
}

module.exports = Contact;
