const FeeStructure = require('../models/FeeStructure');
const logger = require('../config/logger');

class FeeController {
  static async createFeeStructure(req, res) {
    try {
      const { className, tuitionFee, transportFee, uniformFee, examFee, activityFee, totalFee, description, academicYear } = req.body;

      if (!className || !totalFee) {
        return res.status(400).json({
          success: false,
          message: 'Class name and total fee are required'
        });
      }

      const fee = await FeeStructure.create({
        className,
        tuitionFee: tuitionFee || 0,
        transportFee: transportFee || 0,
        uniformFee: uniformFee || 0,
        examFee: examFee || 0,
        activityFee: activityFee || 0,
        totalFee,
        description,
        academicYear
      });

      logger.info(`Fee structure created for class: ${className}`);

      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: fee
      });
    } catch (error) {
      logger.error('Create fee structure error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create fee structure'
      });
    }
  }

  static async getFeeStructures(req, res) {
    try {
      const fees = await FeeStructure.getAll();

      res.status(200).json({
        success: true,
        data: fees
      });
    } catch (error) {
      logger.error('Fetch fee structures error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee structures'
      });
    }
  }

  static async getFeeByClass(req, res) {
    try {
      const { className } = req.params;
      const academicYear = req.query.academicYear || new Date().getFullYear().toString();
      const fee = await FeeStructure.findByClass(className, academicYear);

      if (!fee) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found for this class'
        });
      }

      res.status(200).json({
        success: true,
        data: fee
      });
    } catch (error) {
      logger.error('Fetch fee by class error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fee structure'
      });
    }
  }

  static async updateFeeStructure(req, res) {
    try {
      const { id } = req.params;
      const updated = await FeeStructure.update(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Fee structure updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update fee structure error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update fee structure'
      });
    }
  }

  static async getClassList(req, res) {
    try {
      const classes = ['NUR', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

      res.status(200).json({
        success: true,
        data: classes
      });
    } catch (error) {
      logger.error('Fetch class list error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch class list'
      });
    }
  }
}

module.exports = FeeController;
