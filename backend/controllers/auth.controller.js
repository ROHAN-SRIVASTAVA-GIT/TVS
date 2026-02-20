const User = require('../models/User');
const OTP = require('../models/OTP');
const { db } = require('../config/db');
const { hashPassword, comparePasswords, generateToken, generateRefreshToken } = require('../utils/helpers');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { sendWelcomeEmail } = require('../utils/emailService');
const { sendOTPSMS } = require('../utils/smsService');
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

class AuthController {
  static async sendOTP(req, res) {
    try {
      const { email, phone, purpose = 'verification' } = req.body;

      let verifyType = '';
      if (purpose === 'registration') verifyType = 'User Registration';
      else if (purpose === 'login') verifyType = 'Login';
      else if (purpose === 'receipt') verifyType = 'Receipt Access';
      else if (purpose === 'payment') verifyType = 'Payment Verification';
      else verifyType = 'Verification';

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone is required'
        });
      }

      const recentAttempts = await OTP.getAttemptCount(email, phone, purpose, 30);
      if (recentAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please try again after 30 minutes'
        });
      }

      const recentOTP = await OTP.getLatest(email, phone, purpose);
      if (recentOTP) {
        const timeSince = (Date.now() - new Date(recentOTP.created_at).getTime()) / 1000;
        if (timeSince < 60) {
          return res.status(429).json({
            success: false,
            message: 'OTP already sent. Please wait 60 seconds.',
            retryAfter: 60 - Math.floor(timeSince)
          });
        }
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const ipAddress = req.ip || req.connection?.remoteAddress;

      await OTP.create({
        email,
        phone,
        otpCode,
        purpose,
        expiresInMinutes: 10,
        ipAddress
      });

      if (email) {
        logger.info(`[OTP] Preparing to send email to: ${email}, purpose: ${purpose}`);
        const emailService = require('../utils/emailService');
        const result = await emailService.sendEmail(
          email,
          `🔐 OTP for ${verifyType} - Top View Public School`,
          getOTPEamilTemplate(otpCode, verifyType)
        );
        logger.info(`[OTP] Email send result for ${email}: ${result}`);
      }

      if (phone) {
        logger.info(`[OTP] Preparing to send SMS to: ${phone}, purpose: ${purpose}`);
        const smsResult = await sendOTPSMS(phone, otpCode);
        logger.info(`[OTP] SMS send result for ${phone}: ${smsResult}`);
      }

      logger.info(`[OTP] OTP sent successfully for ${purpose}: ${email || phone}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          emailSent: !!email,
          phoneSent: !!phone,
          expiresIn: 600,
          purpose
        }
      });

    } catch (error) {
      logger.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  }

  static async verifyOTP(req, res) {
    try {
      const { email, phone, otp, purpose = 'verification' } = req.body;

      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP is required'
        });
      }

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone is required'
        });
      }

      const result = await OTP.verify(email, phone, otp, purpose);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Invalid or expired OTP'
        });
      }

      const verificationToken = generateToken(
        { verified: true, purpose, email, phone, timestamp: Date.now() },
        '1h'
      );

      logger.info(`OTP verified for ${purpose}: ${email || phone}`);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          verified: true,
          purpose,
          verificationToken
        }
      });

    } catch (error) {
      logger.error('Verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify OTP'
      });
    }
  }

  static async register(req, res) {
    try {
      const { email, phone, firstName, lastName, password, role = 'parent', verificationToken } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      if (!verificationToken) {
        return res.status(400).json({
          success: false,
          message: 'OTP verification required. Please verify your email first.',
          requiresVerification: true
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'your-secret-key');
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired verification. Please try again.',
          requiresVerification: true
        });
      }

      if (!decoded.verified || decoded.purpose !== 'registration') {
        return res.status(400).json({
          success: false,
          message: 'Please complete OTP verification first',
          requiresVerification: true
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      const hashedPassword = await hashPassword(password);
      
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role
      });

      await sendWelcomeEmail(user.email, user.first_name);

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      logger.info(`User registered with OTP verification: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'Registration completed successfully!',
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
        message: 'Registration failed'
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password, verificationToken, useOTP = false } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      if (useOTP) {
        if (!verificationToken) {
          return res.status(400).json({
            success: false,
            message: 'OTP verification required',
            requiresVerification: true
          });
        }

        let decoded;
        try {
          decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'your-secret-key');
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Invalid verification. Please try again.',
            requiresVerification: true
          });
        }

        if (!decoded.verified || decoded.purpose !== 'login') {
          return res.status(400).json({
            success: false,
            message: 'Please complete OTP verification first',
            requiresVerification: true
          });
        }
      } else {
        if (!password) {
          return res.status(400).json({
            success: false,
            message: 'Password is required'
          });
        }

        const { error, value } = loginValidator(req.body);
        if (error) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.details.map(e => e.message)
          });
        }
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!useOTP) {
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      logger.info(`User logged in: ${user.email} (${useOTP ? 'OTP' : 'Password'})`);

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
        message: 'Login failed'
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

const getOTPEamilTemplate = (otp, purpose) => {
  const schoolName = 'Top View Public School';
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification - ${schoolName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .email-wrapper { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center; }
        .school-name { color: white; font-size: 24px; font-weight: 700; }
        .tagline { color: #ffd700; font-size: 14px; margin-top: 5px; }
        .content { padding: 40px 30px; }
        .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; }
        .otp-label { color: white; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }
        .otp-code { color: white; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 13px; }
        .footer { background: #1a1a2e; padding: 25px 30px; text-align: center; }
        .footer-text { color: #aaa; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <div class="school-name">${schoolName}</div>
                <div class="tagline">Excellence in Education</div>
            </div>
            <div class="content">
                <p style="margin-bottom: 20px;">Dear User,</p>
                <p>Greetings from <strong>${schoolName}</strong>!</p>
                <p style="margin: 20px 0;">Your One-Time Password (OTP) for <strong>${purpose}</strong> is:</p>
                <div class="otp-box">
                    <div class="otp-label">Your OTP</div>
                    <div class="otp-code">${otp}</div>
                </div>
                <p style="margin: 20px 0; color: #666;">This OTP is valid for 10 minutes only.</p>
                <div class="warning">
                    <strong>Security Notice:</strong>
                    <ul style="margin-top: 8px; padding-left: 20px;">
                        <li>Never share your OTP with anyone</li>
                        <li>Our staff will NEVER ask for your OTP</li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                </div>
            </div>
            <div class="footer">
                <p class="footer-text">© ${year} ${schoolName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

module.exports = AuthController;
