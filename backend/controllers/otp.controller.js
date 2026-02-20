const OTP = require('../models/OTP');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');
const logger = require('../config/logger');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW = 30;
const OTP_EXPIRY_MINUTES = 10;

class OTPController {
  static async sendOTP(req, res) {
    try {
      const { email, phone, purpose = 'verification' } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number is required'
        });
      }

      // Validate email format if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }
      }

      // Validate phone format if provided
      if (phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid phone number format'
          });
        }
      }

      // Check rate limiting
      const recentAttempts = await OTP.getAttemptCount(email, phone, purpose, RATE_LIMIT_WINDOW);
      
      if (recentAttempts >= MAX_ATTEMPTS) {
        return res.status(429).json({
          success: false,
          message: `Too many OTP requests. Please try again after ${RATE_LIMIT_WINDOW} minutes`,
          retryAfter: RATE_LIMIT_WINDOW * 60
        });
      }

      // Check if there's a recent valid OTP
      const recentOTP = await OTP.getLatest(email, phone, purpose);
      if (recentOTP) {
        const timeSinceLastOTP = (Date.now() - new Date(recentOTP.created_at).getTime()) / 1000;
        if (timeSinceLastOTP < 60) {
          return res.status(429).json({
            success: false,
            message: 'OTP already sent. Please wait 60 seconds before requesting again',
            retryAfter: 60 - Math.floor(timeSinceLastOTP)
          });
        }
      }

      // Generate new OTP
      const otpCode = generateOTP();
      
      // Save OTP to database
      await OTP.create({
        email,
        phone,
        otpCode,
        purpose,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        ipAddress
      });

      // Send OTP via email
      if (email) {
        await sendEmail({
          to: email,
          subject: '🔐 Your OTP for Top View Public School',
          html: getOTPEemailTemplate(otpCode, purpose, email)
        });
      }

      // Send OTP via SMS (if phone provided)
      if (phone) {
        await sendSMS({
          to: phone,
          message: `Your OTP for Top View Public School is: ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share this OTP.`
        });
      }

      logger.info(`OTP sent successfully to ${email || phone} for ${purpose}`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          emailSent: !!email,
          phoneSent: !!phone,
          expiresIn: OTP_EXPIRY_MINUTES * 60
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
          message: 'Email or phone number is required'
        });
      }

      // Verify OTP
      const result = await OTP.verify(email, phone, otp, purpose);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      logger.info(`OTP verified successfully for ${email || phone} for ${purpose}`);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          verified: true,
          purpose
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

  static async resendOTP(req, res) {
    try {
      const { email, phone, purpose = 'verification' } = req.body;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number is required'
        });
      }

      // Check rate limiting for resend
      const recentAttempts = await OTP.getAttemptCount(email, phone, `${purpose}_resend`, RATE_LIMIT_WINDOW);
      
      if (recentAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many resend requests. Please try again later'
        });
      }

      // Generate new OTP
      const otpCode = generateOTP();
      const ipAddress = req.ip || req.connection.remoteAddress;

      await OTP.create({
        email,
        phone,
        otpCode,
        purpose: `${purpose}_resend`,
        expiresInMinutes: OTP_EXPIRY_MINUTES,
        ipAddress
      });

      // Send OTP via email
      if (email) {
        await sendEmail({
          to: email,
          subject: '🔐 Your New OTP for Top View Public School',
          html: getOTPEemailTemplate(otpCode, purpose, email)
        });
      }

      // Send OTP via SMS
      if (phone) {
        await sendSMS({
          to: phone,
          message: `Your new OTP for Top View Public School is: ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
        });
      }

      logger.info(`OTP resent to ${email || phone}`);

      res.status(200).json({
        success: true,
        message: 'OTP resent successfully'
      });

    } catch (error) {
      logger.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }
  }
}

const getOTPEemailTemplate = (otp, purpose, email) => {
  const schoolName = 'Top View Public School';
  const schoolLogo = 'https://your-school-logo-url.com/logo.png';
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification - ${schoolName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f7fa;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-wrapper {
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 15px;
        }
        .school-name {
            color: white;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        .tagline {
            color: #ffd700;
            font-size: 14px;
            margin-top: 5px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            color: #333;
            font-size: 18px;
            margin-bottom: 20px;
        }
        .otp-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            color: white;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .otp-code {
            color: white;
            font-size: 36px;
            font-weight: 700;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .info-box {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
        }
        .info-item {
            display: flex;
            align-items: center;
            margin: 10px 0;
            color: #555;
            font-size: 14px;
        }
        .info-icon {
            margin-right: 10px;
            font-size: 18px;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 13px;
            color: #856404;
        }
        .footer {
            background: #1a1a2e;
            padding: 25px 30px;
            text-align: center;
        }
        .footer-text {
            color: #aaa;
            font-size: 13px;
        }
        .footer-address {
            color: #888;
            font-size: 12px;
            margin-top: 8px;
        }
        @media only screen and (max-width: 600px) {
            .container {
                padding: 10px;
            }
            .content, .header {
                padding: 25px 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <div class="header">
                <img src="${schoolLogo}" alt="${schoolName}" class="logo" onerror="this.style.display='none'">
                <div class="school-name">${schoolName}</div>
                <div class="tagline">Excellence in Education</div>
            </div>
            
            <div class="content">
                <p class="greeting">Dear Parent/Guardian,</p>
                
                <p>Greetings from <strong>${schoolName}</strong>!</p>
                
                <p style="margin: 20px 0; color: #555;">
                    We received a request to verify your email address for accessing our school portal. 
                    Please use the following One-Time Password (OTP):
                </p>
                
                <div class="otp-box">
                    <div class="otp-label">Your OTP</div>
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="info-box">
                    <div class="info-item">
                        <span class="info-icon">⏱️</span>
                        <span><strong>Valid for:</strong> 10 minutes</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">🔢</span>
                        <span><strong>Purpose:</strong> ${purpose === 'verification' ? 'Email Verification' : purpose}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">📧</span>
                        <span><strong>Email:</strong> ${email}</span>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong>
                    <ul style="margin-top: 8px; padding-left: 20px;">
                        <li>Never share your OTP with anyone</li>
                        <li>Our staff will NEVER ask for your OTP</li>
                        <li>This OTP is valid for one-time use only</li>
                        <li>If you didn't request this, please ignore this email</li>
                    </ul>
                </div>
                
                <p style="margin-top: 25px; color: #777; font-size: 14px;">
                    For any assistance, please contact our school office during working hours.
                </p>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    © ${year} ${schoolName}. All rights reserved.
                </p>
                <p class="footer-address">
                    Top View Public School | Education City, State - PIN<br>
                    Phone: +91-XXXXXXXXXX | Email: info@topviewpublicschool.edu.in
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};

module.exports = OTPController;
