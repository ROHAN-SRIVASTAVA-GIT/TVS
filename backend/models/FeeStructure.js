const { db } = require('../config/db');
const logger = require('../config/logger');

class FeeStructure {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS fee_structures (
          id SERIAL PRIMARY KEY,
          class_name VARCHAR(50) NOT NULL,
          academic_year VARCHAR(20) NOT NULL,
          tuition_fee DECIMAL(10, 2) DEFAULT 0,
          transport_fee DECIMAL(10, 2) DEFAULT 0,
          uniform_fee DECIMAL(10, 2) DEFAULT 0,
          exam_fee DECIMAL(10, 2) DEFAULT 0,
          activity_fee DECIMAL(10, 2) DEFAULT 0,
          total_fee DECIMAL(10, 2) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_fee_structures_class ON fee_structures(class_name)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_fee_structures_year ON fee_structures(academic_year)`);
      
      logger.info('Fee Structures table created successfully');
    } catch (error) {
      logger.error('Error creating fee_structures table:', error);
    }
  }

  static async create(feeData) {
    const { className, academicYear, tuitionFee = 0, transportFee = 0, uniformFee = 0, examFee = 0, activityFee = 0 } = feeData;
    const totalFee = tuitionFee + transportFee + uniformFee + examFee + activityFee;

    try {
      const result = await db.query(
        `INSERT INTO fee_structures (class_name, academic_year, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [className, academicYear, tuitionFee, transportFee, uniformFee, examFee, activityFee, totalFee]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating fee structure:', error);
      throw error;
    }
  }

  static async findByClass(className, academicYear = null) {
    try {
      let result;
      if (academicYear) {
        result = await db.query(
          'SELECT * FROM fee_structures WHERE class_name = $1 AND academic_year = $2 AND is_active = true',
          [className, academicYear]
        );
      } else {
        result = await db.query(
          'SELECT * FROM fee_structures WHERE class_name = $1 AND is_active = true ORDER BY academic_year DESC LIMIT 1',
          [className]
        );
      }
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding fee structure:', error);
      throw error;
    }
  }

  static async findAll(activeOnly = true) {
    try {
      const query = activeOnly 
        ? 'SELECT * FROM fee_structures WHERE is_active = true ORDER BY class_name, academic_year DESC'
        : 'SELECT * FROM fee_structures ORDER BY class_name, academic_year DESC';
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching fee structures:', error);
      throw error;
    }
  }

  static async update(id, feeData) {
    const { className, academicYear, tuitionFee, transportFee, uniformFee, examFee, activityFee, isActive } = feeData;
    const totalFee = tuitionFee + transportFee + uniformFee + examFee + activityFee;

    try {
      const result = await db.query(
        `UPDATE fee_structures SET 
          class_name = $1, academic_year = $2, tuition_fee = $3, transport_fee = $4, 
          uniform_fee = $5, exam_fee = $6, activity_fee = $7, total_fee = $8, 
          is_active = $9, updated_at = CURRENT_TIMESTAMP
         WHERE id = $10 RETURNING *`,
        [className, academicYear, tuitionFee, transportFee, uniformFee, examFee, activityFee, totalFee, isActive, id]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating fee structure:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await db.query('DELETE FROM fee_structures WHERE id = $1', [id]);
      return true;
    } catch (error) {
      logger.error('Error deleting fee structure:', error);
      throw error;
    }
  }
}

module.exports = FeeStructure;
