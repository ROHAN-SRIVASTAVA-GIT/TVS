require('dotenv').config();

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const MailComposer = require('nodemailer/lib/mail-composer');
const logger = require('../config/logger');

logger.info(`[EmailService] === INITIALIZING ===`);
logger.info(`[EmailService] OAUTH_CLIENT_ID present: ${!!process.env.OAUTH_CLIENT_ID}`);
logger.info(`[EmailService] OAUTH_CLIENT_SECRET present: ${!!process.env.OAUTH_CLIENT_SECRET}`);
logger.info(`[EmailService] OAUTH_REFRESH_TOKEN present: ${!!process.env.OAUTH_REFRESH_TOKEN}`);
logger.info(`[EmailService] OAUTH_EMAIL present: ${!!process.env.OAUTH_EMAIL}`);

const SCHOOL_LOGO_URL = process.env.SCHOOL_LOGO_URL || 'https://topviewpublicschool.vercel.app/logo.png';
const SCHOOL_NAME = 'Top View Public School';
const SCHOOL_TAGLINE = 'Excellence in Education';
const SCHOOL_ADDRESS = 'Manju Sadan Basdiha, Near College Gate, Surya Mandir, Panki Palamu, Jharkhand 822122';
const SCHOOL_PHONE = '9470525155 / 9199204566';
const SCHOOL_EMAIL = 'topviewpublicschool@gmail.com';
const SCHOOL_WEBSITE = 'www.topviewpublicschool.com';

class EmailService {
  constructor() {
    if (process.env.OAUTH_CLIENT_ID && process.env.OAUTH_CLIENT_SECRET && process.env.OAUTH_REFRESH_TOKEN) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
      );
      this.oauth2Client.setCredentials({
        refresh_token: process.env.OAUTH_REFRESH_TOKEN
      });
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      this.useGmailApi = true;
      logger.info(`[EmailService] Using Gmail API (HTTP)`);
    } else {
      this.useGmailApi = false;
      logger.info(`[EmailService] Gmail API not configured, falling back to SMTP`);
      this.initSMTP();
    }
  }

  initSMTP() {
    logger.info(`[EmailService] Attempting Gmail SMTP configuration...`);
    logger.info(`[EmailService] Gmail user: ${process.env.EMAIL_USER}`);
    
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000
    });
    
    logger.info(`[EmailService] Gmail SMTP config: host=smtp.gmail.com, port=465, secure=true`);
    logger.info(`[EmailService] Transporter created, verifying connection...`);

    this.transporter.verify((error, success) => {
      if (error) {
        logger.error(`[EmailService] SMTP VERIFICATION FAILED: ${error.message}`);
      } else {
        logger.info(`[EmailService] SMTP VERIFICATION SUCCESS`);
      }
    });
  }

  async sendEmailViaGmailApi(to, subject, htmlContent) {
    try {
      const mailOptions = {
        from: `${SCHOOL_NAME} <${process.env.OAUTH_EMAIL}>`,
        to: to,
        subject: subject,
        html: htmlContent,
        textEncoding: 'base64'
      };

      const mail = new MailComposer(mailOptions);
      const message = await mail.compile().build();
      const rawMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: rawMessage
        }
      });

      logger.info(`[EmailService] ✓ Email sent via Gmail API! Message ID: ${result.data.id}`);
      return true;
    } catch (error) {
      logger.error(`[EmailService] Gmail API Error: ${error.message}`);
      throw error;
    }
  }

  async sendEmailViaSMTP(to, subject, htmlContent) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || `${SCHOOL_NAME} <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`[EmailService] ✓ Email sent via SMTP! MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`[EmailService] SMTP Error: ${error.message}`);
      return false;
    }
  }
}

const emailServiceInstance = new EmailService();

const sendEmail = async (to, subject, htmlContent) => {
  try {
    logger.info(`[EmailService] sendEmail called`);
    logger.info(`[EmailService] To: "${to}"`);
    logger.info(`[EmailService] Subject: "${subject}"`);
    logger.info(`[EmailService] Using: ${emailServiceInstance.useGmailApi ? 'Gmail API (HTTP)' : 'SMTP'}`);
    
    if (emailServiceInstance.useGmailApi) {
      return await emailServiceInstance.sendEmailViaGmailApi(to, subject, htmlContent);
    } else {
      return await emailServiceInstance.sendEmailViaSMTP(to, subject, htmlContent);
    }
  } catch (error) {
    logger.error(`[EmailService] ✗ Email sending FAILED: ${error.message}`);
    return false;
  }
};

const baseEmailTemplate = (content) => {
  return `
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SCHOOL_NAME}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      height: 40px;
      background: #ffffff;
      border-radius: 50% 50% 0 0;
    }
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 15px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .school-name {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .tagline {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .greeting {
      color: #333333;
      font-size: 20px;
      margin-bottom: 25px;
      font-weight: 600;
    }
    .message {
      color: #666666;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 25px;
    }
    .highlight-box {
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      border-radius: 15px;
      padding: 25px;
      margin: 25px 0;
      border-left: 4px solid #2a5298;
    }
    .highlight-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .highlight-item:last-child { border-bottom: none; }
    .highlight-label { color: #666666; font-weight: 500; }
    .highlight-value { color: #1e3c72; font-weight: 700; }
    .success-icon {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 25px;
      box-shadow: 0 10px 30px rgba(40, 167, 69, 0.4);
      position: relative;
    }
    .success-icon::before {
      content: '✓';
      color: white;
      font-size: 50px;
      font-weight: bold;
    }
    .verified-badge {
      display: inline-block;
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 8px 20px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
    }
    .footer {
      background: #1e3c72;
      padding: 30px;
      text-align: center;
    }
    .footer-text {
      color: rgba(255, 255, 255, 0.8);
      font-size: 13px;
      margin-bottom: 15px;
    }
    .footer-contact {
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      line-height: 2;
    }
    .footer-contact span {
      display: inline-block;
      margin: 0 15px;
    }
    .footer-divider {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      margin: 20px 0;
      padding-top: 20px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: white;
      padding: 15px 35px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      box-shadow: 0 5px 20px rgba(42, 82, 152, 0.4);
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(42, 82, 152, 0.5);
    }
    @media (max-width: 600px) {
      .email-container { border-radius: 10px; }
      .header { padding: 30px 20px; }
      .school-name { font-size: 22px; }
      .content { padding: 30px 20px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${SCHOOL_LOGO_URL}" alt="${SCHOOL_NAME}" class="logo" onerror="this.style.display='none'">
      <div class="school-name">${SCHOOL_NAME}</div>
      <div class="tagline">${SCHOOL_TAGLINE}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <div class="footer-text">
        This is an automated email from <strong>${SCHOOL_NAME}</strong>. Please do not reply to this email.
      </div>
      <div class="footer-contact">
        <span>📍 ${SCHOOL_ADDRESS}</span><br>
        <span>📞 ${SCHOOL_PHONE}</span> | 
        <span>✉️ ${SCHOOL_EMAIL}</span><br>
        <span>🌐 ${SCHOOL_WEBSITE}</span>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const sendAdmissionConfirmation = async (email, name, admissionNumber, className, academicYear) => {
  const content = `
    <div class="success-icon"></div>
    <div class="greeting">Dear ${name},</div>
    <div class="message">
      🎉 <strong>Congratulations!</strong> Your admission application to <strong>${SCHOOL_NAME}</strong> has been received successfully!
    </div>
    <div class="highlight-box">
      <div class="highlight-item">
        <span class="highlight-label">Admission Number</span>
        <span class="highlight-value">${admissionNumber}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Student Name</span>
        <span class="highlight-value">${name}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Email</span>
        <span class="highlight-value">${email}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Class Applied</span>
        <span class="highlight-value">${className}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Academic Year</span>
        <span class="highlight-value">${academicYear}</span>
      </div>
    </div>
    <div class="verified-badge">✓ Application Received</div>
    <div class="message">
      Our admission team will review your application and contact you shortly with further details.
    </div>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/dashboard" class="button">View Dashboard</a>
  `;

  return sendEmail(email, `🎓 Admission Confirmed - ${SCHOOL_NAME}`, baseEmailTemplate(content));
};

const sendPaymentReceipt = async (email, name, amount, transactionId, feeType, className, academicYear, paymentDate) => {
  const formattedDate = paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  
  const content = `
    <div class="success-icon"></div>
    <div class="greeting">Dear ${name},</div>
    <div class="message">
      ✅ <strong>Payment Verified Successfully!</strong><br>
      Thank you for your payment to <strong>${SCHOOL_NAME}</strong>.
    </div>
    <div class="highlight-box">
      <div class="highlight-item">
        <span class="highlight-label">Student Name</span>
        <span class="highlight-value">${name}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Email</span>
        <span class="highlight-value">${email}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Transaction ID</span>
        <span class="highlight-value">${transactionId}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Amount Paid</span>
        <span class="highlight-value">₹${parseFloat(amount).toLocaleString('en-IN')}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Fee Type</span>
        <span class="highlight-value">${feeType}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Class</span>
        <span class="highlight-value">${className}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Academic Year</span>
        <span class="highlight-value">${academicYear}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Payment Date</span>
        <span class="highlight-value">${formattedDate}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Status</span>
        <span class="highlight-value" style="color: #28a745;">✓ Payment Verified</span>
      </div>
    </div>
    <div class="verified-badge">✓ Payment Confirmed</div>
    <div class="message">
      Your payment has been processed successfully. Please keep this receipt for your records.
    </div>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/dashboard" class="button">View Dashboard</a>
  `;

  return sendEmail(email, `💰 Payment Receipt - ${SCHOOL_NAME}`, baseEmailTemplate(content));
};

const sendContactReply = async (email, name, message) => {
  const content = `
    <div class="success-icon"></div>
    <div class="greeting">Dear ${name},</div>
    <div class="message">
      Thank you for contacting <strong>${SCHOOL_NAME}</strong>!
    </div>
    <div class="highlight-box">
      <p style="color: #666666; line-height: 1.8;">${message}</p>
    </div>
    <div class="message">
      We have received your message and will get back to you within 24-48 hours.
    </div>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/contact" class="button">Contact Us</a>
  `;

  return sendEmail(email, `📬 We Received Your Message - ${SCHOOL_NAME}`, baseEmailTemplate(content));
};

const sendWelcomeEmail = async (email, name) => {
  const content = `
    <div class="success-icon"></div>
    <div class="greeting">Welcome to ${SCHOOL_NAME}, ${name}!</div>
    <div class="message">
      Your student portal account has been created successfully. You can now access all school information, fee details, notices, and more.
    </div>
    <div class="highlight-box">
      <div class="highlight-item">
        <span class="highlight-label">Student Name</span>
        <span class="highlight-value">${name}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Email</span>
        <span class="highlight-value">${email}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Login URL</span>
        <span class="highlight-value">${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/login</span>
      </div>
    </div>
    <div class="verified-badge">✓ Account Verified</div>
    <div class="message">
      If you have any questions, feel free to contact us.
    </div>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/login" class="button">Login Now</a>
  `;

  return sendEmail(email, `🎉 Welcome to ${SCHOOL_NAME} Portal`, baseEmailTemplate(content));
};

const sendAdminReplyEmail = async (email, userName, originalSubject, replyMessage) => {
  const content = `
    <div class="success-icon">📧</div>
    <div class="greeting">Dear ${userName},</div>
    <div class="message">
      Thank you for contacting ${SCHOOL_NAME}. We have received your query regarding "<strong>${originalSubject}</strong>" and here is our response:
    </div>
    <div class="highlight-box" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; color: white;">
      <p style="color: white; font-size: 16px; line-height: 1.8; margin: 0;">${replyMessage}</p>
    </div>
    <div class="message">
      If you have any further questions or need additional assistance, please don't hesitate to reach out to us.
    </div>
    <div class="contact-info" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <h4 style="margin: 0 0 15px 0; color: #1a1a2e;">Contact Information</h4>
      <p style="margin: 5px 0; color: #666;"><strong>Address:</strong> ${SCHOOL_ADDRESS}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${SCHOOL_EMAIL}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${SCHOOL_PHONE}</p>
    </div>
    <div class="verified-badge">✓ Response from School Administration</div>
    <div class="message" style="font-size: 12px; color: #999; margin-top: 20px;">
      This is an automated response from ${SCHOOL_NAME}. Please do not reply directly to this email. For urgent queries, please call us during school hours.
    </div>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/contact" class="button">Visit Contact Page</a>
  `;

  return sendEmail(email, `Re: ${originalSubject} - ${SCHOOL_NAME}`, baseEmailTemplate(content));
};

const sendContactConfirmation = async (email, name, subject) => {
  const content = `
    <div class="success-icon">✅</div>
    <div class="greeting">Dear ${name},</div>
    <div class="message">
      Thank you for contacting ${SCHOOL_NAME}. We have received your message and our team will review it shortly.
    </div>
    <div class="highlight-box">
      <div class="highlight-item">
        <span class="highlight-label">Your Subject</span>
        <span class="highlight-value">${subject}</span>
      </div>
      <div class="highlight-item">
        <span class="highlight-label">Reference ID</span>
        <span class="highlight-value">TVPS-CONTACT-${Date.now()}</span>
      </div>
    </div>
    <div class="message">
      <strong>What happens next?</strong><br/>
      📧 Our administration team will review your message within 24-48 hours<br/>
      📞 We may contact you on your phone number for further clarification<br/>
      💬 A detailed response will be sent to your email address
    </div>
    <div class="contact-info">
      <h4>School Contact Information</h4>
      <p><strong>Address:</strong> ${SCHOOL_ADDRESS}</p>
      <p><strong>Email:</strong> ${SCHOOL_EMAIL}</p>
      <p><strong>Phone:</strong> ${SCHOOL_PHONE}</p>
      <p><strong>Office Hours:</strong> Mon - Sat, 9:00 AM - 5:00 PM</p>
    </div>
    <div class="verified-badge">✓ Message Received</div>
    <div class="message" style="font-size: 12px; color: #999; margin-top: 20px;">
      Please do not reply to this automated email. For urgent inquiries, please contact us during school office hours.
    </div>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/contact" class="button">Visit Contact Page</a>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/about" class="button" style="background: #28a745; margin-left: 10px;">Learn More About Us</a>
  `;

  return sendEmail(email, `📬 We Received Your Message - ${SCHOOL_NAME}`, baseEmailTemplate(content));
};

const sendUserCredentials = async (email, name, tempPassword) => {
  const content = `
    <div class="success-icon">🔐</div>
    <div class="greeting">Dear ${name},</div>
    <div class="message">
      Your account has been created at <strong>${SCHOOL_NAME}</strong>. Please find your login credentials below:
    </div>
    <div class="highlight-box" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 25px; border-radius: 15px; color: white; text-align: center;">
      <div style="margin: 10px 0;">
        <span style="font-size: 14px; opacity: 0.9;">Email</span><br>
        <span style="font-size: 18px; font-weight: bold;">${email}</span>
      </div>
      <div style="margin: 10px 0;">
        <span style="font-size: 14px; opacity: 0.9;">Temporary Password</span><br>
        <span style="font-size: 18px; font-weight: bold;">${tempPassword}</span>
      </div>
    </div>
    <div class="message" style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
      <strong>⚠️ Important:</strong> Please change your password after first login for security purposes.
    </div>
    <div class="message">
      You can now login to the school portal using these credentials.
    </div>
    <div class="contact-info" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <h4 style="margin: 0 0 15px 0; color: #1a1a2e;">Login Here</h4>
      <p style="margin: 5px 0; color: #666;"><strong>Portal URL:</strong> ${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/login</p>
      <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${SCHOOL_EMAIL}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Phone:</strong> ${SCHOOL_PHONE}</p>
    </div>
    <div class="verified-badge">✓ Account Created by Administrator</div>
    <a href="${process.env.FRONTEND_URL || 'https://topviewpublicschool.vercel.app'}/login" class="button">Login Now</a>
  `;

  return sendEmail(email, `🔑 Your Login Credentials - ${SCHOOL_NAME}`, baseEmailTemplate(content));
};

module.exports = {
  sendEmail,
  sendAdmissionConfirmation,
  sendPaymentReceipt,
  sendContactReply,
  sendWelcomeEmail,
  sendAdminReplyEmail,
  sendContactConfirmation,
  sendUserCredentials,
  baseEmailTemplate
};
