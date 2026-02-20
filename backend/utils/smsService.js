const logger = require('../config/logger');

const sendSMS = async ({ to, message }) => {
  try {
    // Check if SMS credentials are configured
    if (!process.env.SMS_API_KEY || !process.env.SMS_SENDER_ID) {
      logger.warn('SMS not configured. Skipping SMS send.');
      logger.info(`Would send SMS to ${to}: ${message}`);
      return { success: true, mock: true };
    }

    // Format phone number
    let phone = to;
    if (phone.startsWith('+91')) {
      phone = phone.substring(3);
    }
    if (!phone.startsWith('91')) {
      phone = '91' + phone;
    }

    const apiKey = process.env.SMS_API_KEY;
    const senderId = process.env.SMS_SENDER_ID;
    const route = process.env.SMS_ROUTE || 'OTP';
    
    // Using Fast2SMS or similar service
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&sender_id=${senderId}&message=${encodeURIComponent(message)}&language=english&route=${route}&numbers=${phone}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const result = await response.json();
    
    if (result.return) {
      logger.info(`SMS sent successfully to ${to}`);
      return { success: true, messageId: result.job_id || result.request_id };
    } else {
      logger.error(`SMS failed: ${result.message}`);
      return { success: false, error: result.message };
    }

  } catch (error) {
    logger.error('SMS send error:', error);
    // Don't throw - just log the error
    return { success: false, error: error.message };
  }
};

const sendOTPSMS = async (phone, otp) => {
  const message = `Your OTP for Top View Public School is ${otp}. Valid for 10 minutes. Do not share this OTP with anyone. - TVPS`;
  return sendSMS({ to: phone, message });
};

const sendAdmissionConfirmationSMS = async (phone, studentName, formNumber) => {
  const message = `Dear Parent, Admission for ${studentName} has been submitted successfully. Form No: ${formNumber}. Thank you for choosing Top View Public School. - TVPS`;
  return sendSMS({ to: phone, message });
};

const sendPaymentConfirmationSMS = async (phone, amount, receiptNo) => {
  const message = `Payment of Rs.${amount} received successfully. Receipt No: ${receiptNo}. Thank you for your payment. - Top View Public School`;
  return sendSMS({ to: phone, message });
};

module.exports = {
  sendSMS,
  sendOTPSMS,
  sendAdmissionConfirmationSMS,
  sendPaymentConfirmationSMS
};
