const User = require('../models/User');
const Admission = require('../models/Admission');
const Payment = require('../models/Payment');
const Contact = require('../models/Contact');
const Notice = require('../models/Notice');
const logger = require('../config/logger');

class AdminController {
  static async getDashboardStats(req, res) {
    try {
      const [users, admissions, paymentStats, contacts, notices] = await Promise.all([
        User.getAllUsers(1000, 0),
        Admission.getAllAdmissions(null, 1000, 0),
        Payment.getPaymentStats(),
        Contact.getAll(null, 1000, 0),
        Notice.getAll(1000, 0)
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalUsers: users.total,
          totalAdmissions: admissions.total,
          totalPayments: paymentStats.total_payments,
          totalRevenue: paymentStats.total_amount,
          completedPayments: paymentStats.completed_payments,
          pendingPayments: paymentStats.pending_payments,
          totalContacts: contacts.total,
          totalNotices: notices.total
        }
      });
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats'
      });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await User.getAllUsers(limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  }

  static async getAllAdmissions(req, res) {
    try {
      const status = req.query.status;
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await Admission.getAllAdmissions(status, limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch all admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admissions'
      });
    }
  }

  static async updateAdmissionStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const updated = await Admission.updateStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Admission status updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update admission status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update admission status'
      });
    }
  }

  static async getAllPayments(req, res) {
    try {
      const status = req.query.status;
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      // Fetch all payments with filters
      const query = status 
        ? `SELECT * FROM payments WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
        : `SELECT * FROM payments ORDER BY created_at DESC LIMIT $1 OFFSET $2`;

      const { db } = require('../config/db');
      const params = status ? [status, limit, offset] : [limit, offset];
      const result = await db.query(query, params);

      const countQuery = status 
        ? `SELECT COUNT(*) FROM payments WHERE status = $1`
        : `SELECT COUNT(*) FROM payments`;
      const countParams = status ? [status] : [];
      const countResult = await db.query(countQuery, countParams);

      res.status(200).json({
        success: true,
        data: {
          payments: result.rows,
          total: parseInt(countResult.rows[0].count)
        }
      });
    } catch (error) {
      logger.error('Fetch all payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payments'
      });
    }
  }

  static async getAllContacts(req, res) {
    try {
      const status = req.query.status;
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await Contact.getAll(status, limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch all contacts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contacts'
      });
    }
  }

  static async getAllNotices(req, res) {
    try {
      const limit = req.query.limit || 20;
      const offset = req.query.offset || 0;

      const result = await Notice.getAll(limit, offset);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Fetch all notices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notices'
      });
    }
  }
}

module.exports = AdminController;
