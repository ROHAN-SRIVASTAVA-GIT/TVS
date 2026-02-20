const { db } = require('../config/db');
const logger = require('../config/logger');

class Student {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          roll_number VARCHAR(50) UNIQUE,
          class VARCHAR(50) NOT NULL,
          section VARCHAR(10),
          admission_date DATE,
          date_of_birth DATE,
          gender VARCHAR(20),
          religion VARCHAR(50),
          caste VARCHAR(50),
          aadhaar_number VARCHAR(12),
          blood_group VARCHAR(10),
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_students_class ON students(class)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number)`);
      
      logger.info('Students table created successfully');
    } catch (error) {
      logger.error('Error creating students table:', error);
    }
  }

  static async create(studentData) {
    const {
      userId,
      rollNumber,
      className,
      section,
      admissionDate,
      dateOfBirth,
      gender,
      religion,
      caste,
      aadhaarNumber,
      bloodGroup
    } = studentData;

    const query = `
      INSERT INTO students (
        user_id, roll_number, class, section, admission_date,
        date_of_birth, gender, religion, caste, aadhaar_number, blood_group
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        userId, rollNumber, className, section, admissionDate,
        dateOfBirth, gender, religion, caste, aadhaarNumber, bloodGroup
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating student:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM students WHERE user_id = $1';
    
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding student by user_id:', error);
      throw error;
    }
  }

  static async findByClass(className) {
    const query = 'SELECT * FROM students WHERE class = $1 AND status = $2 ORDER BY roll_number';
    
    try {
      const result = await db.query(query, [className, 'active']);
      return result.rows;
    } catch (error) {
      logger.error('Error finding students by class:', error);
      throw error;
    }
  }

  static async update(userId, updateData) {
    const allowedFields = ['roll_number', 'class', 'section', 'gender', 'date_of_birth', 'status'];
    const updates = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (updates.length === 0) {
      return null;
    }

    values.push(userId);
    const query = `
      UPDATE students
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating student:', error);
      throw error;
    }
  }
}

module.exports = Student;
