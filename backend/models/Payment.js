const { db } = require('../config/db');
const logger = require('../config/logger');

class Payment {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
          student_name VARCHAR(255),
          parent_email VARCHAR(255),
          parent_phone VARCHAR(50),
          razorpay_order_id VARCHAR(255),
          razorpay_payment_id VARCHAR(255),
          razorpay_signature VARCHAR(255),
          phonepe_order_id VARCHAR(255),
          phonepe_token VARCHAR(255),
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(10) DEFAULT 'INR',
          fee_type VARCHAR(50),
          academic_year VARCHAR(20),
          class VARCHAR(50),
          payment_method VARCHAR(50),
          payment_type VARCHAR(50) DEFAULT 'online',
          status VARCHAR(50) DEFAULT 'pending',
          transaction_date TIMESTAMP,
          notes TEXT,
          screenshot_url VARCHAR(500),
          receipt_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order ON payments(razorpay_order_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_phonepe_order ON payments(phonepe_order_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`);

      await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS student_name VARCHAR(255)`);
      await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS parent_email VARCHAR(255)`);
      await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(50)`);
      await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot_url VARCHAR(500)`);
      await db.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'online'`);
      
      logger.info('Payments table created/updated successfully');
    } catch (error) {
      logger.error('Error creating payments table:', error);
    }
  }

  static async create(paymentData) {
    const {
      userId,
      studentId,
      studentName,
      parentEmail,
      parentPhone,
      razorpayOrderId,
      phonepeOrderId,
      phonepeToken,
      amount,
      feeType,
      academicYear,
      className,
      notes,
      paymentType,
      status,
      screenshotUrl
    } = paymentData;

    const query = `
      INSERT INTO payments (
        user_id, student_id, student_name, parent_email, parent_phone,
        razorpay_order_id, phonepe_order_id, phonepe_token, amount,
        fee_type, academic_year, class, notes, payment_type, status, screenshot_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        userId, studentId, studentName, parentEmail, parentPhone,
        razorpayOrderId, phonepeOrderId, phonepeToken, amount,
        feeType, academicYear, className, notes, paymentType || 'online', status || 'pending', screenshotUrl
      ]);
      logger.info(`Payment created: ${result.rows[0].id} - Order ID: ${phonepeOrderId || razorpayOrderId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating payment:', error);
      throw error;
    }
  }

  static async updateByOrderId(orderId, paymentData) {
    const {
      razorpayPaymentId,
      razorpaySignature,
      status,
      paymentMethod,
      transactionDate
    } = paymentData;

    const query = `
      UPDATE payments
      SET 
        razorpay_payment_id = COALESCE($1, razorpay_payment_id),
        razorpay_signature = COALESCE($2, razorpay_signature),
        status = COALESCE($3, status),
        payment_method = COALESCE($4, payment_method),
        transaction_date = COALESCE($5, transaction_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE razorpay_order_id = $6 OR phonepe_order_id = $6
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        razorpayPaymentId,
        razorpaySignature,
        status,
        paymentMethod,
        transactionDate,
        orderId
      ]);
      logger.info(`Payment updated: ${orderId} - Status: ${status}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating payment:', error);
      throw error;
    }
  }

  static async findByUserId(userId, email = null, phone = null, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM payments
      WHERE user_id = $1 OR parent_email = $2 OR parent_phone = $3
      ORDER BY created_at DESC
      LIMIT $4 OFFSET $5
    `;
    
    try {
      const result = await db.query(query, [userId, email, phone, limit, offset]);
      const countResult = await db.query(
        'SELECT COUNT(*) FROM payments WHERE user_id = $1 OR parent_email = $2 OR parent_phone = $3', 
        [userId, email, phone]
      );
      
      return {
        payments: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error finding payments by user:', error);
      throw error;
    }
  }

  static async findByEmailOrPhone(email, phone, limit = 20, offset = 0) {
    const query = `
      SELECT * FROM payments
      WHERE parent_email = $1 OR parent_phone = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    try {
      const result = await db.query(query, [email, phone, limit, offset]);
      const countResult = await db.query(
        'SELECT COUNT(*) FROM payments WHERE parent_email = $1 OR parent_phone = $2', 
        [email, phone]
      );
      
      return {
        payments: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error finding payments by email/phone:', error);
      throw error;
    }
  }

  static async findByOrderId(razorpayOrderId) {
    const query = 'SELECT * FROM payments WHERE razorpay_order_id = $1';
    
    try {
      const result = await db.query(query, [razorpayOrderId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding payment by order ID:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM payments WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding payment by ID:', error);
      throw error;
    }
  }

  static async getAll(limit = 50, offset = 0, status = null, paymentType = null) {
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (paymentType) {
      query += ` AND payment_type = $${paramCount}`;
      params.push(paymentType);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    try {
      const result = await db.query(query, params);
      const countQuery = status 
        ? 'SELECT COUNT(*) FROM payments WHERE status = $1'
        : 'SELECT COUNT(*) FROM payments';
      const countParams = status ? [status] : [];
      const countResult = await db.query(countQuery, countParams);

      return {
        payments: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error fetching all payments:', error);
      throw error;
    }
  }

  static async getPaymentStats() {
    const query = `
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
      FROM payments
    `;
    
    try {
      const result = await db.query(query);
      return result.rows[0];
    } catch (error) {
      logger.error('Error fetching payment stats:', error);
      throw error;
    }
  }
}

module.exports = Payment;
