const User = require('../models/User');
const Admission = require('../models/Admission');
const Payment = require('../models/Payment');
const Contact = require('../models/Contact');
const Notice = require('../models/Notice');
const FeeStructure = require('../models/FeeStructure');
const Gallery = require('../models/Gallery');
const Student = require('../models/Student');
const logger = require('../config/logger');
const { db } = require('../config/db');

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

  // User Management
  static async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await db.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
      res.status(200).json({ success: true, message: 'User status updated' });
    } catch (error) {
      logger.error('Update user status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update user' });
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM users WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'User deleted' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }

  // Admission Management
  static async getAdmissionById(req, res) {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM admissions WHERE id = $1', [id]);
      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      logger.error('Get admission error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch admission' });
    }
  }

  static async updateAdmission(req, res) {
    try {
      const { id } = req.params;
      const fields = req.body;
      const updates = Object.keys(fields).map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = Object.values(fields);
      await db.query(`UPDATE admissions SET ${updates} WHERE id = $1`, [id, ...values]);
      res.status(200).json({ success: true, message: 'Admission updated' });
    } catch (error) {
      logger.error('Update admission error:', error);
      res.status(500).json({ success: false, message: 'Failed to update admission' });
    }
  }

  static async deleteAdmission(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM admissions WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'Admission deleted' });
    } catch (error) {
      logger.error('Delete admission error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete admission' });
    }
  }

  // Payment Management
  static async getPhonePePayments(req, res) {
    try {
      const status = req.query.status;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      
      let query = 'SELECT * FROM payments WHERE phonepe_order_id IS NOT NULL';
      const params = [];
      
      if (status) {
        query += ' AND status = $1';
        params.push(status);
        query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
        params.push(limit, offset);
      } else {
        query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
        params.push(limit, offset);
      }
      
      const result = await db.query(query, params);
      
      const countQuery = status 
        ? 'SELECT COUNT(*) FROM payments WHERE phonepe_order_id IS NOT NULL AND status = $1'
        : 'SELECT COUNT(*) FROM payments WHERE phonepe_order_id IS NOT NULL';
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
      logger.error('Fetch PhonePe payments error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch PhonePe payments' });
    }
  }

  static async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await db.query('UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
      res.status(200).json({ success: true, message: 'Payment status updated' });
    } catch (error) {
      logger.error('Update payment status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment' });
    }
  }

  static async deletePayment(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM payments WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'Payment deleted' });
    } catch (error) {
      logger.error('Delete payment error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete payment' });
    }
  }

  // Contact Management
  static async updateContactStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await db.query('UPDATE contacts SET status = $1 WHERE id = $2', [status, id]);
      res.status(200).json({ success: true, message: 'Contact status updated' });
    } catch (error) {
      logger.error('Update contact status error:', error);
      res.status(500).json({ success: false, message: 'Failed to update contact' });
    }
  }

  static async deleteContact(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM contacts WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'Contact deleted' });
    } catch (error) {
      logger.error('Delete contact error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete contact' });
    }
  }

  // Notice Management
  static async createNotice(req, res) {
    try {
      const { title, content, priority, target_audience } = req.body;
      const result = await db.query(
        'INSERT INTO notices (title, content, priority, target_audience, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, content, priority || 'normal', target_audience || 'all', req.userId]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      logger.error('Create notice error:', error);
      res.status(500).json({ success: false, message: 'Failed to create notice' });
    }
  }

  static async updateNotice(req, res) {
    try {
      const { id } = req.params;
      const { title, content, priority, target_audience, status } = req.body;
      await db.query(
        'UPDATE notices SET title = $1, content = $2, priority = $3, target_audience = $4, status = $5, updated_at = NOW() WHERE id = $6',
        [title, content, priority, target_audience, status, id]
      );
      res.status(200).json({ success: true, message: 'Notice updated' });
    } catch (error) {
      logger.error('Update notice error:', error);
      res.status(500).json({ success: false, message: 'Failed to update notice' });
    }
  }

  static async deleteNotice(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM notices WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'Notice deleted' });
    } catch (error) {
      logger.error('Delete notice error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete notice' });
    }
  }

  // Fee Structure Management
  static async getAllFeeStructures(req, res) {
    try {
      const result = await db.query('SELECT * FROM fee_structures ORDER BY class_name, academic_year DESC');
      res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      logger.error('Fetch fee structures error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch fee structures' });
    }
  }

  static async createFeeStructure(req, res) {
    try {
      const { class_name, academic_year, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee } = req.body;
      const result = await db.query(
        'INSERT INTO fee_structures (class_name, academic_year, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [class_name, academic_year, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      logger.error('Create fee structure error:', error);
      res.status(500).json({ success: false, message: 'Failed to create fee structure' });
    }
  }

  static async updateFeeStructure(req, res) {
    try {
      const { id } = req.params;
      const { class_name, academic_year, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee } = req.body;
      await db.query(
        'UPDATE fee_structures SET class_name = $1, academic_year = $2, tuition_fee = $3, transport_fee = $4, uniform_fee = $5, exam_fee = $6, activity_fee = $7, total_fee = $8 WHERE id = $9',
        [class_name, academic_year, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee, id]
      );
      res.status(200).json({ success: true, message: 'Fee structure updated' });
    } catch (error) {
      logger.error('Update fee structure error:', error);
      res.status(500).json({ success: false, message: 'Failed to update fee structure' });
    }
  }

  static async deleteFeeStructure(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM fee_structures WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'Fee structure deleted' });
    } catch (error) {
      logger.error('Delete fee structure error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete fee structure' });
    }
  }

  // Gallery Management
  static async getAllGallery(req, res) {
    try {
      const result = await db.query('SELECT * FROM gallery ORDER BY created_at DESC');
      res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      logger.error('Fetch gallery error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch gallery' });
    }
  }

  static async createGalleryItem(req, res) {
    try {
      const title = req.body.title || (req.body.get && req.body.get('title'));
      const category = req.body.category || (req.body.get && req.body.get('category'));
      const imageUrl = req.file ? `/uploads/gallery/${req.file.filename}` : null;
      
      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }
      
      const result = await db.query(
        'INSERT INTO gallery (title, image_url, category) VALUES ($1, $2, $3) RETURNING *',
        [title, imageUrl, category || 'general']
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      logger.error('Create gallery error:', error);
      res.status(500).json({ success: false, message: 'Failed to create gallery item' });
    }
  }

  static async deleteGalleryItem(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM gallery WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'Gallery item deleted' });
    } catch (error) {
      logger.error('Delete gallery error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete gallery item' });
    }
  }

  // Student Management
  static async getAllStudents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      
      let query = 'SELECT * FROM students';
      const params = [];
      
      if (search) {
        query += ' WHERE name LIKE $1 OR admission_number LIKE $1';
        params.push(`%${search}%`);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);
      
      const result = await db.query(query, params);
      
      const countQuery = search 
        ? 'SELECT COUNT(*) FROM students WHERE name LIKE $1 OR admission_number LIKE $1'
        : 'SELECT COUNT(*) FROM students';
      const countParams = search ? [`%${search}%`] : [];
      const countResult = await db.query(countQuery, countParams);

      res.status(200).json({
        success: true,
        data: {
          students: result.rows,
          total: parseInt(countResult.rows[0].count)
        }
      });
    } catch (error) {
      logger.error('Fetch students error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
  }

  static async getStudentById(req, res) {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM students WHERE id = $1', [id]);
      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      logger.error('Get student error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch student' });
    }
  }

  static async createStudent(req, res) {
    try {
      const { name, admission_number, class_name, father_name, mother_name, phone, email, address, dob, gender } = req.body;
      const result = await db.query(
        'INSERT INTO students (name, admission_number, class_name, father_name, mother_name, phone, email, address, dob, gender) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
        [name, admission_number, class_name, father_name, mother_name, phone, email, address, dob, gender]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
      logger.error('Create student error:', error);
      res.status(500).json({ success: false, message: 'Failed to create student' });
    }
  }

  static async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const fields = req.body;
      const updates = Object.keys(fields).map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = Object.values(fields);
      await db.query(`UPDATE students SET ${updates} WHERE id = $1`, [id, ...values]);
      res.status(200).json({ success: true, message: 'Student updated' });
    } catch (error) {
      logger.error('Update student error:', error);
      res.status(500).json({ success: false, message: 'Failed to update student' });
    }
  }

  static async deleteStudent(req, res) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM students WHERE id = $1', [id]);
      res.status(200).json({ success: true, message: 'Student deleted' });
    } catch (error) {
      logger.error('Delete student error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
  }
}

module.exports = AdminController;
