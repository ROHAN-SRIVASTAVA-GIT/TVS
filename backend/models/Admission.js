const { db } = require('../config/db');
const logger = require('../config/logger');

class Admission {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admissions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          student_name VARCHAR(255) NOT NULL,
          father_name VARCHAR(255),
          father_occupation VARCHAR(100),
          father_contact VARCHAR(20),
          mother_name VARCHAR(255),
          mother_occupation VARCHAR(100),
          mother_contact VARCHAR(20),
          whatsapp_contact VARCHAR(20),
          email VARCHAR(255),
          date_of_birth DATE,
          gender VARCHAR(20),
          religion VARCHAR(50),
          caste VARCHAR(50),
          aadhaar_number VARCHAR(12),
          blood_group VARCHAR(10),
          corresponding_address TEXT,
          corresponding_district VARCHAR(100),
          corresponding_pin VARCHAR(10),
          corresponding_state VARCHAR(100),
          permanent_address TEXT,
          permanent_district VARCHAR(100),
          permanent_pin VARCHAR(10),
          permanent_state VARCHAR(100),
          admission_class VARCHAR(50),
          academic_year VARCHAR(20),
          form_number VARCHAR(100) UNIQUE,
          admission_number VARCHAR(100) UNIQUE,
          admission_date DATE,
          photo_url VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_admissions_user_id ON admissions(user_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_admissions_class ON admissions(admission_class)`);
      
      logger.info('Admissions table created successfully');
    } catch (error) {
      logger.error('Error creating admissions table:', error);
    }
  }

  static async create(admissionData) {
    const columns = Object.keys(admissionData).filter(key => admissionData[key] !== undefined);
    const values = columns.map(col => admissionData[col]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO admissions (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      logger.info(`Admission created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating admission:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM admissions WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding admission:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM admissions WHERE user_id = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding admissions by user:', error);
      throw error;
    }
  }

  static async findByEmailOrPhone(email, phone) {
    const query = 'SELECT * FROM admissions WHERE email = $1 OR father_contact = $2 OR mother_contact = $3 OR whatsapp_contact = $4 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [email, phone, phone, phone]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding admissions by email/phone:', error);
      throw error;
    }
  }

  static async getAllAdmissions(status = null, limit = 20, offset = 0) {
    let query = 'SELECT * FROM admissions';
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
        ? `SELECT COUNT(*) FROM admissions WHERE status = $1`
        : `SELECT COUNT(*) FROM admissions`;
      const countParams = status ? [status] : [];
      const countResult = await db.query(countQuery, countParams);

      return {
        admissions: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error fetching admissions:', error);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE admissions
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [status, id]);
      logger.info(`Admission ${id} status updated to ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating admission status:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      updates.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    values.push(id);
    const query = `
      UPDATE admissions
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating admission:', error);
      throw error;
    }
  }
}

module.exports = Admission;
