const AdmissionPayment = require('../models/AdmissionPayment');
const logger = require('../config/logger');

class AdmissionPaymentController {
  static async createPayment(req, res) {
    try {
      const { orderId, studentName, email, phone, class: className, academicYear, amount, feeType } = req.body;
      
      logger.info('=== Creating admission payment ===');
      logger.info('Request body:', req.body);
      logger.info('OrderId:', orderId, 'StudentName:', studentName, 'Amount:', amount);

      if (!orderId || !studentName || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Order ID, student name and amount are required'
        });
      }

      const payment = await AdmissionPayment.create({
        order_id: orderId,
        student_name: studentName,
        email,
        phone,
        class: className,
        academic_year: academicYear,
        amount,
        fee_type: feeType,
        status: 'pending'
      });

      logger.info('Admission payment created successfully:', payment);
      
      res.status(201).json({
        success: true,
        data: payment
      });
    } catch (error) {
      logger.error('Create admission payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment record'
      });
    }
  }

  static async getPaymentByOrderId(req, res) {
    try {
      const orderId = req.query.orderId;
      
      logger.info('Fetching admission payment for orderId:', orderId);

      if (!orderId) {
        return res.status(400).json({
          success: false,
          message: 'Order ID is required'
        });
      }

      const payment = await AdmissionPayment.findByOrderId(orderId);
      
      logger.info('Found payment:', payment);

      if (!payment) {
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
      logger.error('Get admission payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment'
      });
    }
  }

  static async updatePaymentStatus(req, res) {
    try {
      const { orderId, status, paymentId, transactionId } = req.body;

      logger.info('Full request body:', req.body);
      logger.info('Updating payment status:', { orderId, status, paymentId, transactionId });

      if (!orderId || !status) {
        return res.status(400).json({
          success: false,
          message: 'Order ID and status are required'
        });
      }

      const payment = await AdmissionPayment.updateStatus(orderId, status, paymentId, transactionId);

      if (!payment) {
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
      logger.error('Update admission payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status'
      });
    }
  }
}

module.exports = AdmissionPaymentController;
