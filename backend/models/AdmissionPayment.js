const { db } = require('../config/db');
const logger = require('../config/logger');

class AdmissionPayment {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS admission_payments (
          id SERIAL PRIMARY KEY,
          order_id VARCHAR(255) UNIQUE NOT NULL,
          student_name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          class VARCHAR(50),
          academic_year VARCHAR(20),
          amount DECIMAL(10,2),
          fee_type VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending',
          payment_id VARCHAR(255),
          transaction_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_admission_payments_order_id ON admission_payments(order_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_admission_payments_status ON admission_payments(status)`);
      
      logger.info('Admission payments table created successfully');
    } catch (error) {
      logger.error('Error creating admission payments table:', error);
    }
  }

  static async create(paymentData) {
    const { order_id, student_name, email, phone, class: className, academic_year, amount, fee_type, status, payment_id, transaction_id } = paymentData;
    
    const query = `
      INSERT INTO admission_payments (order_id, student_name, email, phone, class, academic_year, amount, fee_type, status, payment_id, transaction_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    try {
      const result = await db.query(query, [order_id, student_name, email, phone, className, academic_year, amount, fee_type, status || 'pending', payment_id, transaction_id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating admission payment:', error);
      throw error;
    }
  }

  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM admission_payments WHERE order_id = $1';
    
    try {
      const result = await db.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding admission payment by order ID:', error);
      throw error;
    }
  }

  static async updateStatus(orderId, status, paymentId = null, transactionId = null) {
    let query = 'UPDATE admission_payments SET status = $2, updated_at = CURRENT_TIMESTAMP';
    const params = [orderId, status];
    
    if (paymentId) {
      query += ', payment_id = $3';
      params.push(paymentId);
    }
    if (transactionId) {
      query += params.length === 3 ? ', transaction_id = $4' : ', transaction_id = $3';
      params.push(transactionId);
    }
    
    query += ' WHERE order_id = $1 RETURNING *';
    
    try {
      const result = await db.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating admission payment status:', error);
      throw error;
    }
  }

  static async findByStatus(status) {
    const query = 'SELECT * FROM admission_payments WHERE status = $1 ORDER BY created_at DESC';
    
    try {
      const result = await db.query(query, [status]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding admission payments by status:', error);
      throw error;
    }
  }
}

module.exports = AdmissionPayment;
