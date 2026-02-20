const { db } = require('../config/db');
const logger = require('../config/logger');

class OTP {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS otps (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255),
          phone VARCHAR(20),
          otp_code VARCHAR(6) NOT NULL,
          otp_type VARCHAR(20) NOT NULL DEFAULT 'verification',
          purpose VARCHAR(50) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          attempts INTEGER DEFAULT 0,
          verified_at TIMESTAMP,
          status VARCHAR(20) DEFAULT 'pending',
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_otps_purpose ON otps(purpose)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at)`);
      
      logger.info('OTPs table created successfully');
    } catch (error) {
      logger.error('Error creating OTPs table:', error);
    }
  }

  static async create(otpData) {
    const { email, phone, otpCode, purpose, expiresInMinutes = 10, ipAddress } = otpData;
    
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    
    const query = `
      INSERT INTO otps (email, phone, otp_code, purpose, expires_at, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, phone, otp_code, purpose, expires_at, status, created_at
    `;
    
    try {
      const result = await db.query(query, [email, phone, otpCode, purpose, expiresAt, ipAddress]);
      logger.info(`OTP created for ${email || phone}, purpose: ${purpose}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating OTP:', error);
      throw error;
    }
  }

  static async verify(email, phone, otpCode, purpose) {
    const query = `
      SELECT * FROM otps 
      WHERE (email = $1 OR phone = $2) 
        AND otp_code = $3 
        AND purpose = $4 
        AND status = 'pending'
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    try {
      const result = await db.query(query, [email, phone, otpCode, purpose]);
      
      if (result.rows.length === 0) {
        return { valid: false, message: 'Invalid or expired OTP' };
      }
      
      const otp = result.rows[0];
      
      // Mark as verified
      await db.query(
        `UPDATE otps SET status = 'verified', verified_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [otp.id]
      );
      
      logger.info(`OTP verified for ${email || phone}, purpose: ${purpose}`);
      return { valid: true, otp };
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      throw error;
    }
  }

  static async incrementAttempts(id) {
    const query = `UPDATE otps SET attempts = attempts + 1 WHERE id = $1`;
    
    try {
      await db.query(query, [id]);
    } catch (error) {
      logger.error('Error incrementing OTP attempts:', error);
    }
  }

  static async markFailed(id) {
    const query = `UPDATE otps SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
    
    try {
      await db.query(query, [id]);
    } catch (error) {
      logger.error('Error marking OTP as failed:', error);
    }
  }

  static async getLatest(email, phone, purpose) {
    const query = `
      SELECT * FROM otps 
      WHERE (email = $1 OR phone = $2) 
        AND purpose = $3 
        AND status = 'pending'
        AND expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    try {
      const result = await db.query(query, [email, phone, purpose]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting latest OTP:', error);
      throw error;
    }
  }

  static async cleanup() {
    const query = `DELETE FROM otps WHERE expires_at < CURRENT_TIMESTAMP OR status IN ('verified', 'failed')`;
    
    try {
      const result = await db.query(query);
      if (result.rowCount > 0) {
        logger.info(`Cleaned up ${result.rowCount} expired/failed OTPs`);
      }
    } catch (error) {
      logger.error('Error cleaning up OTPs:', error);
    }
  }

  static async getAttemptCount(email, phone, purpose, windowMinutes = 30) {
    const query = `
      SELECT COUNT(*) as count FROM otps 
      WHERE (email = $1 OR phone = $2) 
        AND purpose = $3
        AND created_at > NOW() - INTERVAL '${windowMinutes} minutes'
    `;
    
    try {
      const result = await db.query(query, [email, phone, purpose]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error('Error getting OTP attempt count:', error);
      return 0;
    }
  }
}

module.exports = OTP;
