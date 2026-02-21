const { db } = require('../config/db');
const logger = require('../config/logger');

class User {
  static async createTable() {
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          phone VARCHAR(20),
          address TEXT,
          occupation VARCHAR(100),
          role VARCHAR(50) DEFAULT 'parent',
          status VARCHAR(50) DEFAULT 'active',
          avatar VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
      
      // Add address and occupation columns if they don't exist
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100)`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true`);
      
      logger.info('Users table created successfully');
    } catch (error) {
      logger.error('Error creating users table:', error);
    }
  }

  static async create(userData) {
    const { email, password, firstName, lastName, phone, role = 'parent' } = userData;
    
    const query = `
      INSERT INTO users (email, password, first_name, last_name, phone, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, phone, role, created_at
    `;
    
    try {
      const result = await db.query(query, [
        email.toLowerCase(),
        password,
        firstName,
        lastName,
        phone,
        role
      ]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    
    try {
      const result = await db.query(query, [email.toLowerCase()]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT id, email, first_name, last_name, phone, role, status, avatar, password, created_at FROM users WHERE id = $1';
    
    try {
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const { firstName, lastName, phone, avatar, address, occupation } = updateData;
    
    const query = `
      UPDATE users
      SET first_name = COALESCE($1, first_name), 
          last_name = COALESCE($2, last_name), 
          phone = COALESCE($3, phone), 
          avatar = COALESCE($4, avatar),
          address = COALESCE($5, address),
          occupation = COALESCE($6, occupation),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, email, first_name, last_name, phone, address, occupation, role, avatar, updated_at
    `;
    
    try {
      const result = await db.query(query, [firstName, lastName, phone, avatar, address, occupation, id]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  static async getAllUsers(limit = 10, offset = 0, status = null, role = null, search = null) {
    let conditions = [];
    let params = [];
    let paramCount = 1;

    if (status) {
      conditions.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    if (role) {
      conditions.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }
    if (search) {
      conditions.push(`(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    const query = `
      SELECT id, email, first_name, last_name, phone, role, status, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);

    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countParams = params.slice(0, -2);
    
    try {
      const result = await db.query(query, params);
      const countResult = await db.query(countQuery, countParams);
      
      return {
        users: result.rows,
        total: parseInt(countResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Error fetching all users:', error);
      throw error;
    }
  }
}

module.exports = User;
