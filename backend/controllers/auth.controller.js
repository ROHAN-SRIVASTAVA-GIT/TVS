const User = require('../models/User');
const { db } = require('../config/db');
const { hashPassword, comparePasswords, generateToken, generateRefreshToken, isValidEmail } = require('../utils/helpers');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { sendWelcomeEmail } = require('../utils/emailService');
const logger = require('../config/logger');

class AuthController {
  static async register(req, res) {
    try {
      const { error, value } = registerValidator(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(e => e.message)
        });
      }

      const existingUser = await User.findByEmail(value.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      const hashedPassword = await hashPassword(value.password);
      
      const user = await User.create({
        email: value.email,
        password: hashedPassword,
        firstName: value.firstName,
        lastName: value.lastName,
        phone: value.phone,
        role: value.role
      });

      await sendWelcomeEmail(user.email, user.first_name);

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            address: user.address,
            occupation: user.occupation,
            role: user.role
          },
          token,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }

  static async login(req, res) {
    try {
      const { error, value } = loginValidator(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(e => e.message)
        });
      }

      const user = await User.findByEmail(value.email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const passwordMatch = await comparePasswords(value.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      logger.info(`User logged in: ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            address: user.address,
            occupation: user.occupation,
            role: user.role
          },
          token,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile'
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const updated = await User.update(req.userId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      const user = await User.findById(req.userId);
      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      res.status(200).json({
        success: true,
        data: { token }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  static async lookupStudent(req, res) {
    try {
      const { email, phone } = req.body;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number is required'
        });
      }

      let query = 'SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.created_at FROM users u';
      let conditions = [];
      let params = [];

      if (email) {
        conditions.push(`LOWER(u.email) = LOWER($${params.length + 1})`);
        params.push(email);
      }

      if (phone) {
        conditions.push(`u.phone = $${params.length + 1}`);
        params.push(phone);
      }

      query += ' WHERE ' + conditions.join(' OR ');

      const result = await db.query(query, params);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No student found with this email or phone number'
        });
      }

      const user = result.rows[0];

      const studentQuery = `
        SELECT s.*, u.email, u.first_name, u.last_name, u.phone 
        FROM students s 
        JOIN users u ON s.user_id = u.id 
        WHERE u.id = $1
      `;
      const studentResult = await db.query(studentQuery, [user.id]);

      res.status(200).json({
        success: true,
        data: {
          user: user,
          student: studentResult.rows[0] || null
        }
      });
    } catch (error) {
      logger.error('Lookup student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to lookup student'
      });
    }
  }
}

module.exports = AuthController;
