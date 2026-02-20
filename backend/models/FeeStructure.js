const { db } = require('../config/db');
const logger = require('../config/logger');

class FeeStructure {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS fee_structures (
          id SERIAL PRIMARY KEY,
          class VARCHAR(50) NOT NULL UNIQUE,
          tuition_fee DECIMAL(10, 2),
          transport_fee DECIMAL(10, 2),
          uniform_fee DECIMAL(10, 2),
          exam_fee DECIMAL(10, 2),
          activity_fee DECIMAL(10, 2),
          total_fee DECIMAL(10, 2),
          description TEXT,
          academic_year VARCHAR(20),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_fee_structures_class ON fee_structures(class)`);
      
      logger.info('Fee Structures table created successfully');
    } catch (error) {
      logger.error('Error creating fee_structures table:', error);
    }
  }

  static async create(feeData) {
    const {
      className,
      tuitionFee,
      transportFee,
      uniformFee,
      examFee,
      activityFee,
      totalFee,
      description,
      academicYear
    } = feeData;

    const query = `
      INSERT INTO fee_structures (
        class, tuition_fee, transport_fee, uniform_fee, exam_fee,
        activity_fee, total_fee, description, academic_year
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        className, tuitionFee, transportFee, uniformFee, examFee,
        activityFee, totalFee, description, academicYear
      ]);
      logger.info(`Fee structure created for class: ${className}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating fee structure:', error);
      throw error;
    }
  }

  static async findByClass(className) {
    const query = 'SELECT * FROM fee_structures WHERE class = $1 AND is_active = true';
    
    try {
      const result = await db.query(query, [className]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding fee structure:', error);
      throw error;
    }
  }

  static async getAll() {
    const query = 'SELECT * FROM fee_structures WHERE is_active = true ORDER BY class';
    
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching all fee structures:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const {
      tuitionFee,
      transportFee,
      uniformFee,
      examFee,
      activityFee,
      totalFee,
      description
    } = updateData;

    const query = `
      UPDATE fee_structures
      SET 
        tuition_fee = COALESCE($1, tuition_fee),
        transport_fee = COALESCE($2, transport_fee),
        uniform_fee = COALESCE($3, uniform_fee),
        exam_fee = COALESCE($4, exam_fee),
        activity_fee = COALESCE($5, activity_fee),
        total_fee = COALESCE($6, total_fee),
        description = COALESCE($7, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        tuitionFee, transportFee, uniformFee, examFee,
        activityFee, totalFee, description, id
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating fee structure:', error);
      throw error;
    }
  }
}

module.exports = FeeStructure;
