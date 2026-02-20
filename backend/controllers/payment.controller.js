const Payment = require('../models/Payment');
const { getPhonePeClient, Env } = require('../config/phonepe');
const { paymentValidator, paymentVerificationValidator } = require('../validators/payment.validator');
const { CreateSdkOrderRequest, StandardCheckoutPayRequest, MetaInfo } = require('phonepe-pg-sdk-node');
const { randomUUID } = require('crypto');
const logger = require('../config/logger');
const { sendPaymentReceipt, sendAdmissionConfirmation } = require('../utils/emailService');

class PaymentController {
  static async createOrder(req, res) {
    try {
      console.log('=== PhonePe Payment Create Order Started ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { error, value } = paymentValidator(req.body);
      
      if (error) {
        console.log('Validation error:', error.details);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(e => e.message)
        });
      }

      const amountInPaisa = Math.round(value.amount * 100);
      console.log('Amount in paisa:', amountInPaisa);

      const merchantOrderId = `ORDER_${Date.now()}_${randomUUID().substring(0, 8)}`;
      console.log('Merchant Order ID:', merchantOrderId);

      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admission?orderId=${merchantOrderId}`;
      console.log('Redirect URL:', redirectUrl);

      const metaInfo = MetaInfo.builder()
        .udf1(value.studentName || '')
        .udf2(value.email || '')
        .udf3(value.phone || '')
        .udf4(value.feeType || '')
        .udf5(value.className || '')
        .build();

      console.log('MetaInfo built:', metaInfo);

      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amountInPaisa)
        .redirectUrl(redirectUrl)
        .metaInfo(metaInfo)
        .expireAfter(3600)
        .message(`Fee Payment - ${value.feeType} - Class ${value.className}`)
        .build();

      console.log('PhonePe request built successfully');
      console.log('Request:', JSON.stringify(request, (key, val) => {
        if (val && val.toJSON) return val.toJSON();
        return val;
      }, 2));

      const client = getPhonePeClient();
      
      console.log('Creating PhonePe order...');
      const response = await client.pay(request);
      
      console.log('PhonePe response:');
      console.log('- orderId:', response.orderId);
      console.log('- state:', response.state);
      console.log('- redirectUrl:', response.redirectUrl);
      console.log('- instrumentResponse:', response.instrumentResponse);
      console.log('- full response:', JSON.stringify(response, (key, val) => {
        if (val && val.toJSON) return val.toJSON();
        return val;
      }, 2));

      const userId = req.userId || null;

      const payment = await Payment.create({
        userId: userId,
        studentId: value.studentId || null,
        studentName: value.studentName || '',
        parentEmail: value.email || '',
        parentPhone: value.phone || '',
        razorpayOrderId: merchantOrderId,
        phonepeOrderId: response.orderId,
        amount: value.amount,
        feeType: value.feeType,
        academicYear: value.academicYear,
        className: value.className,
        notes: value.notes,
        paymentType: 'online',
        status: 'pending'
      });

      console.log('Payment record created in DB with ID:', payment.id);
      logger.info(`PhonePe payment order created: ${merchantOrderId}, PhonePe Order ID: ${response.orderId}`);

      res.status(201).json({
        success: true,
        message: 'Payment order created successfully',
        data: {
          orderId: merchantOrderId,
          phonepeOrderId: response.orderId,
          redirectUrl: response.redirectUrl,
          amount: value.amount,
          currency: 'INR',
          paymentId: payment.id
        }
      });
    } catch (error) {
      console.error('=== PhonePe Create Order ERROR ===');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      console.error('====================================');
      logger.error('PhonePe Create order error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: error.message
      });
    }
  }

  static async verifyPayment(req, res) {
    try {
      console.log('=== PhonePe Payment Verification Started ===');
      console.log('Request body:', req.body);

      const { merchantOrderId, phonepeOrderId } = req.body;

      if (!merchantOrderId && !phonepeOrderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      const client = getPhonePeClient();
      
      let orderIdToCheck = merchantOrderId;
      
      // If the ID looks like a PhonePe Order ID (OMO_xxx), we need to look up the actual merchantOrderId
      if (orderIdToCheck && orderIdToCheck.startsWith('OMO')) {
        console.log('Received PhonePe Order ID, looking up payment record...');
        const payment = await Payment.findByPhonepeOrderId(orderIdToCheck);
        if (payment) {
          // razorpay_order_id stores the actual merchantOrderId (ORDER_xxx)
          orderIdToCheck = payment.razorpay_order_id || payment.phonepe_order_id;
          console.log('Found actual merchant order ID:', orderIdToCheck);
        } else {
          console.log('Payment record not found for:', orderIdToCheck);
        }
      }
      
      // Also handle if phonepeOrderId is provided separately
      if (!orderIdToCheck && phonepeOrderId) {
        const payment = await Payment.findByPhonepeOrderId(phonepeOrderId);
        if (payment) {
          orderIdToCheck = payment.razorpay_order_id || payment.phonepe_order_id;
          console.log('Found merchant order ID from phonepeOrderId:', orderIdToCheck);
        }
      }

      console.log('Checking order status for:', orderIdToCheck);
      
      const response = await client.getOrderStatus(orderIdToCheck, false);

      console.log('Full PhonePe response:', JSON.stringify(response, null, 2));
      console.log('Order status response:');
      console.log('- orderId:', response.orderId);
      console.log('- state:', response.state);
      console.log('- amount:', response.amount);
      console.log('- response code:', response.code);
      console.log('- response message:', response.message);
      console.log('- all keys:', Object.keys(response));
      console.log('- response stringify:', JSON.stringify(response));

      // Try different response formats based on PhonePe API
      // The new PhonePe API returns different structure
      const state = response.state || response.orderState || response.status || response.orderStatus;
      const code = response.code || response.responseCode;
      const responseMessage = response.message || response.responseMessage;
      
      console.log('Parsed state:', state);
      console.log('Parsed code:', code);
      console.log('Parsed message:', responseMessage);

      let paymentStatus = 'pending';
      let transactionId = null;
      let paymentMode = null;

      // Check for completed payment - various possible values
      if (state === 'COMPLETED' || state === 'PAID' || state === 'Success' || 
          code === 'SUCCESS' || code === '0' || 
          responseMessage === 'Success' || responseMessage === 'PAYMENT_SUCCESS') {
        paymentStatus = 'completed';
        transactionId = response.transactionId || response.orderId || phonepeOrderId;
        paymentMode = response.paymentMode || 'phonepe';
        console.log('Payment marked as COMPLETED');
      } else if (state === 'FAILED' || state === 'FAILED' || 
                 code === 'FAILED' || code === '1' ||
                 responseMessage === 'Failed' || responseMessage === 'PAYMENT_FAILED') {
        paymentStatus = 'failed';
        console.log('Payment marked as FAILED');
      } else {
        console.log('Payment still PENDING, state:', state, 'code:', code, 'message:', responseMessage);
      }

      const payment = await Payment.updateByOrderId(orderIdToCheck, {
        razorpayPaymentId: transactionId,
        status: paymentStatus,
        paymentMethod: paymentMode || 'phonepe',
        transactionDate: new Date()
      });

      console.log('Payment updated in DB:', paymentStatus);
      logger.info(`PhonePe payment verified: ${orderIdToCheck}, State: ${state}`);

      // Send payment receipt email if payment is completed
      if (paymentStatus === 'completed' && payment) {
        try {
          await sendPaymentReceipt(
            payment.email || payment.parent_email,
            payment.student_name,
            payment.amount,
            transactionId,
            payment.fee_type,
            payment.class,
            payment.academic_year,
            payment.created_at
          );
          logger.info(`Payment receipt email sent to: ${payment.email || payment.parent_email}`);
        } catch (emailErr) {
          logger.error('Error sending payment receipt email:', emailErr);
        }
      }

      res.status(200).json({
        success: true,
        message: paymentStatus === 'completed' ? 'Payment verified successfully' : 'Payment not completed',
        data: {
          state: state,
          paymentStatus: paymentStatus,
          transactionId: transactionId,
          amount: response.amount / 100
        }
      });
    } catch (error) {
      console.error('=== PhonePe Verify Payment ERROR ===');
      console.error('Error:', error.message);
      console.error('=====================================');
      logger.error('PhonePe verify payment error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error.message
      });
    }
  }

  static async getPaymentHistory(req, res) {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const userId = req.userId;
      const userEmail = req.user?.email;
      const userPhone = req.user?.phone;

      const result = await Payment.findByUserId(userId, userEmail, userPhone, limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history'
      });
    }
  }

  static async getPaymentHistoryByEmailOrPhone(req, res) {
    try {
      const { email, phone } = req.query;
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone is required'
        });
      }

      const result = await Payment.findByEmailOrPhone(email, phone, limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch payment history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment history'
      });
    }
  }

  static async getPaymentDetails(req, res) {
    try {
      const { orderId } = req.params;
      const payment = await Payment.findByOrderId(orderId);

      if (!payment || (payment.user_id !== req.userId && req.userRole !== 'admin')) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Fetch payment details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }
  }

  // New endpoint to check payment status from DB by payment ID
  static async checkPaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      console.log('Payment status check for ID', id, ':', payment.status);

      res.status(200).json({
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          phonepe_order_id: payment.phonepe_order_id,
          razorpay_order_id: payment.razorpay_order_id,
          transaction_id: payment.transaction_id,
          amount: payment.amount,
          student_name: payment.student_name,
          fee_type: payment.fee_type
        }
      });
    } catch (error) {
      logger.error('Check payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  }

  // Check payment status by PhonePe order ID
  static async checkPaymentStatusByPhonepeOrder(req, res) {
    try {
      const { phonepeOrderId } = req.query;
      
      console.log('=== checkPaymentStatusByPhonepeOrder called ===');
      console.log('phonepeOrderId:', phonepeOrderId);
      console.log('Full query:', req.query);
      console.log('Full URL:', req.originalUrl);
      
      if (!phonepeOrderId) {
        return res.status(400).json({
          success: false,
          message: 'PhonePe order ID is required'
        });
      }
      
      const payment = await Payment.findByPhonepeOrderId(phonepeOrderId);
      
      console.log('Found payment:', payment);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      console.log('Payment status check for PhonePe order', phonepeOrderId, ':', payment.status);

      res.status(200).json({
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          phonepe_order_id: payment.phonepe_order_id,
          razorpay_order_id: payment.razorpay_order_id,
          transaction_id: payment.transaction_id,
          amount: payment.amount,
          student_name: payment.student_name,
          parent_email: payment.parent_email,
          class: payment.class,
          academic_year: payment.academic_year,
          fee_type: payment.fee_type
        }
      });
    } catch (error) {
      logger.error('Check payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  }

  static async getPaymentStats(req, res) {
    try {
      const stats = await Payment.getPaymentStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Fetch payment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment stats'
      });
    }
  }

  static async manualPaymentSubmit(req, res) {
    try {
      console.log('=== Manual Payment Submission Started ===');
      
      const { studentId, studentName, email, phone, amount, feeType, className, academicYear, notes } = req.body;
      
      const screenshotUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;

      console.log('Manual payment data:', {
        studentName, email, phone, amount, feeType, className, screenshotUrl
      });

      const payment = await Payment.create({
        userId: null,
        studentId: studentId || null,
        studentName: studentName,
        parentEmail: email,
        parentPhone: phone,
        razorpayOrderId: `MANUAL_${Date.now()}`,
        amount: parseFloat(amount),
        feeType: feeType,
        academicYear: academicYear,
        className: className,
        notes: notes,
        paymentType: 'manual',
        status: 'pending_verification',
        screenshotUrl: screenshotUrl
      });

      console.log('Manual payment created:', payment.id);
      logger.info(`Manual payment submitted: ${payment.id}`);

      res.status(201).json({
        success: true,
        message: 'Payment screenshot uploaded successfully. We will verify and confirm shortly.',
        data: {
          paymentId: payment.id,
          amount: amount,
          status: 'pending_verification'
        }
      });
    } catch (error) {
      console.error('Manual payment error:', error);
      logger.error('Manual payment submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit payment',
        error: error.message
      });
    }
  }

  static async getAllPayments(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const status = req.query.status;
      const paymentType = req.query.type;

      const result = await Payment.getAll(limit, offset, status, paymentType);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch all payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments'
      });
    }
  }

  // Verify OTP for receipt access (for non-logged-in users)
  static async verifyReceiptAccess(req, res) {
    try {
      const { id } = req.params;
      const { email, phone, otp } = req.body;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone is required'
        });
      }

      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP is required'
        });
      }

      // Find payment first
      const payment = await Payment.findById(id);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Verify OTP
      const OTP = require('../models/OTP');
      const result = await OTP.verify(email, phone, otp, 'receipt');

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP'
        });
      }

      // Generate access token
      const jwt = require('jsonwebtoken');
      const accessToken = generateToken(
        { receiptAccess: true, paymentId: id, email, phone },
        '1h'
      );

      logger.info(`Receipt access verified for payment ${id}`);

      res.status(200).json({
        success: true,
        message: 'Access verified',
        data: {
          accessToken,
          paymentId: id
        }
      });

    } catch (error) {
      logger.error('Verify receipt access error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify access'
      });
    }
  }

  static async generateReceipt(req, res) {
    try {
      const { id } = req.params;
      const payment = await Payment.findById(id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      const receiptNo = `TVPS/P/${String(payment.id).padStart(6, '0')}`;

      const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - Top View Public School</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
    .receipt { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .body { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { color: #1a1a2e; font-size: 16px; font-weight: 600; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #667eea; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 14px; }
    .value { color: #1a1a2e; font-weight: 500; font-size: 14px; }
    .amount { color: #28a745; font-size: 24px; font-weight: 700; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status.pending { background: #fff3cd; color: #856404; }
    .status.completed { background: #d4edda; color: #155724; }
    .status.failed { background: #f8d7da; color: #721c24; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .print-btn { 
      display: block; 
      margin: 20px auto; 
      padding: 12px 30px; 
      background: #667eea; 
      color: white; 
      border: none; 
      border-radius: 5px; 
      cursor: pointer; 
      font-size: 14px;
      text-decoration: none;
      text-align: center;
    }
    .print-btn:hover { background: #5568d3; }
    .print-hint { margin-top: 20px; color: #666; font-size: 13px; text-align: center; }
    .print-btn:hover { background: #5568d3; }
    @media print { body { padding: 0; } .print-btn, .print-hint { display: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Top View Public School</h1>
      <p>Manju Sadan Basdiha, Panki, Palamu, Jharkhand 822122</p>
      <p>Email: topviewpublicschool@gmail.com | Phone: 9470525155</p>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="row">
          <span class="label">Receipt No.</span>
          <span class="value">${receiptNo}</span>
        </div>
        <div class="row">
          <span class="label">Transaction ID</span>
          <span class="value">${payment.phonepe_order_id || payment.razorpay_order_id || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Payment Date</span>
          <span class="value">${new Date(payment.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        <div class="row">
          <span class="label">Payment Type</span>
          <span class="value">${payment.payment_type === 'online' ? 'Online Payment' : 'Manual Payment'}</span>
        </div>
        <div class="row">
          <span class="label">Status</span>
          <span class="value"><span class="status ${payment.status}">${payment.status.toUpperCase()}</span></span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Student Information</div>
        <div class="row">
          <span class="label">Student Name</span>
          <span class="value">${payment.student_name || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Class</span>
          <span class="value">${payment.class || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Academic Year</span>
          <span class="value">${payment.academic_year || 'N/A'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Fee Details</div>
        <div class="row">
          <span class="label">Fee Type</span>
          <span class="value">${(payment.fee_type || '').charAt(0).toUpperCase() + (payment.fee_type || '').slice(1)} Fee</span>
        </div>
        <div class="row">
          <span class="label">Parent Email</span>
          <span class="value">${payment.parent_email || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Parent Phone</span>
          <span class="value">${payment.parent_phone || 'N/A'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="row">
          <span class="label" style="font-size: 18px; font-weight: 600;">Total Amount Paid</span>
          <span class="amount">₹${parseFloat(payment.amount).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>This is a computer-generated receipt. No signature required.</p>
      <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
      <p class="print-hint">To print: Press <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac)</p>
    </div>
  </div>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(receiptHTML);
    } catch (error) {
      console.error('Generate receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate receipt'
      });
    }
  }

  static async generateQuickReceipt(req, res) {
    try {
      const { studentName, class: className, amount, feeType, paymentId, transactionId } = req.query;

      let payment = null;
      if (paymentId) {
        payment = await Payment.findById(paymentId);
      } else if (transactionId) {
        // Look up payment by transaction ID (can be phonepe_order_id or razorpay_order_id)
        const result = await db.query(
          'SELECT * FROM payments WHERE phonepe_order_id = $1 OR razorpay_order_id = $1',
          [transactionId]
        );
        payment = result.rows[0];
      }

      const receiptNo = payment ? `TVPS/P/${String(payment.id).padStart(6, '0')}` : `TVPS/P/${Date.now()}`;
      const student = studentName || (payment?.student_name || 'N/A');
      const studentClass = className || (payment?.class || 'N/A');
      const feeAmount = amount || (payment?.amount || 0);
      const fee = feeType || (payment?.fee_type || 'fee');
      const date = payment ? new Date(payment.created_at) : new Date();
      const status = payment?.status || 'completed';
      const txnId = transactionId || (payment?.phonepe_order_id || payment?.razorpay_order_id || 'N/A');

      const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - Top View Public School</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f5f5f5; }
    .receipt { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .body { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { color: #1a1a2e; font-size: 16px; font-weight: 600; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #667eea; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; font-size: 14px; }
    .value { color: #1a1a2e; font-weight: 500; font-size: 14px; }
    .amount { color: #28a745; font-size: 24px; font-weight: 700; }
    .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status.pending { background: #fff3cd; color: #856404; }
    .status.completed { background: #d4edda; color: #155724; }
    .status.failed { background: #f8d7da; color: #721c24; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
    .print-btn { 
      display: block; 
      margin: 20px auto; 
      padding: 12px 30px; 
      background: #667eea; 
      color: white; 
      border: none; 
      border-radius: 5px; 
      cursor: pointer; 
      font-size: 14px;
      text-decoration: none;
      text-align: center;
    }
    .print-btn:hover { background: #5568d3; }
    .print-hint { margin-top: 20px; color: #666; font-size: 13px; text-align: center; }
    .print-btn:hover { background: #5568d3; }
    @media print { body { padding: 0; } .print-btn, .print-hint { display: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>Top View Public School</h1>
      <p>Manju Sadan Basdiha, Panki, Palamu, Jharkhand 822122</p>
      <p>Email: topviewpublicschool@gmail.com | Phone: 9470525155</p>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">Payment Details</div>
        <div class="row">
          <span class="label">Receipt No.</span>
          <span class="value">${receiptNo}</span>
        </div>
        <div class="row">
          <span class="label">Transaction ID</span>
          <span class="value">${txnId}</span>
        </div>
        <div class="row">
          <span class="label">Payment Date</span>
          <span class="value">${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        <div class="row">
          <span class="label">Payment Type</span>
          <span class="value">${payment?.payment_type === 'online' ? 'Online Payment' : 'Online Payment'}</span>
        </div>
        <div class="row">
          <span class="label">Status</span>
          <span class="value"><span class="status ${status}">${status.toUpperCase()}</span></span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Student Information</div>
        <div class="row">
          <span class="label">Student Name</span>
          <span class="value">${student}</span>
        </div>
        <div class="row">
          <span class="label">Class</span>
          <span class="value">${studentClass}</span>
        </div>
        <div class="row">
          <span class="label">Academic Year</span>
          <span class="value">${payment?.academic_year || '2026-27'}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Fee Details</div>
        <div class="row">
          <span class="label">Fee Type</span>
          <span class="value">${fee.charAt(0).toUpperCase() + fee.slice(1)} Fee</span>
        </div>
        ${payment ? `
        <div class="row">
          <span class="label">Parent Email</span>
          <span class="value">${payment.parent_email || 'N/A'}</span>
        </div>
        <div class="row">
          <span class="label">Parent Phone</span>
          <span class="value">${payment.parent_phone || 'N/A'}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="section">
        <div class="row">
          <span class="label" style="font-size: 18px; font-weight: 600;">Total Amount Paid</span>
          <span class="amount">₹${parseFloat(feeAmount).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>This is a computer-generated receipt. No signature required.</p>
      <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
      <p class="print-hint">To print: Press <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac)</p>
    </div>
  </div>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(receiptHTML);
    } catch (error) {
      console.error('Generate quick receipt error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate receipt'
      });
    }
  }

  static async uploadPaymentProof(req, res) {
    try {
      const { paymentId, studentName, email, phone } = req.body;
      const screenshotUrl = req.file ? `/uploads/payments/${req.file.filename}` : null;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          message: 'Payment ID is required'
        });
      }

      if (!screenshotUrl) {
        return res.status(400).json({
          success: false,
          message: 'Screenshot file is required'
        });
      }

      const payment = await Payment.findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      await db.query(
        `UPDATE payments 
         SET screenshot_url = $1, status = 'pending_verification', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [screenshotUrl, paymentId]
      );

      logger.info(`Payment proof uploaded for payment ID: ${paymentId}`);

      res.status(200).json({
        success: true,
        message: 'Payment proof uploaded successfully'
      });
    } catch (error) {
      console.error('Upload payment proof error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload payment proof'
      });
    }
  }
}

module.exports = PaymentController;
