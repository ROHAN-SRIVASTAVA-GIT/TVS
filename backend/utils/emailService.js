const nodemailer = require('nodemailer');
const logger = require('../config/logger');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${to}:`, error);
    return false;
  }
};

const sendAdmissionConfirmation = async (email, name, admissionNumber) => {
  const htmlContent = `
    <h2>Welcome to Top View Public School</h2>
    <p>Dear ${name},</p>
    <p>Your admission application has been received successfully!</p>
    <p><strong>Admission Number: ${admissionNumber}</strong></p>
    <p>We will contact you soon with further updates.</p>
    <p>Best regards,<br>Top View Public School</p>
  `;

  return sendEmail(email, 'Admission Confirmation', htmlContent);
};

const sendPaymentReceipt = async (email, name, amount, transactionId) => {
  const htmlContent = `
    <h2>Payment Receipt</h2>
    <p>Dear ${name},</p>
    <p>Your payment has been received successfully!</p>
    <p><strong>Amount: ₹${amount}</strong></p>
    <p><strong>Transaction ID: ${transactionId}</strong></p>
    <p>Thank you for your payment.</p>
    <p>Best regards,<br>Top View Public School</p>
  `;

  return sendEmail(email, 'Payment Receipt', htmlContent);
};

const sendContactReply = async (email, name, message) => {
  const htmlContent = `
    <h2>We received your message</h2>
    <p>Dear ${name},</p>
    <p>Thank you for contacting us. Here is our response:</p>
    <p>${message}</p>
    <p>Best regards,<br>Top View Public School Administration</p>
  `;

  return sendEmail(email, 'Contact Response from Top View Public School', htmlContent);
};

const sendWelcomeEmail = async (email, name) => {
  const htmlContent = `
    <h2>Welcome to Top View Public School Portal</h2>
    <p>Dear ${name},</p>
    <p>Your account has been created successfully!</p>
    <p>You can now login to your portal and access all school information.</p>
    <p>Login URL: ${process.env.FRONTEND_URL}/login</p>
    <p>If you have any questions, feel free to contact us.</p>
    <p>Best regards,<br>Top View Public School</p>
  `;

  return sendEmail(email, 'Welcome to Top View Public School', htmlContent);
};

module.exports = {
  sendEmail,
  sendAdmissionConfirmation,
  sendPaymentReceipt,
  sendContactReply,
  sendWelcomeEmail
};
