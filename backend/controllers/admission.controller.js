const Admission = require('../models/Admission');
const { admissionValidator } = require('../validators/admission.validator');
const { generateFormNumber, generateAdmissionNumber } = require('../utils/helpers');
const { sendAdmissionConfirmation } = require('../utils/emailService');
const logger = require('../config/logger');

class AdmissionController {
  static async submitAdmission(req, res) {
    try {
      const { error, value } = admissionValidator(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.details.map(e => e.message)
        });
      }

      const formNumber = generateFormNumber();
      const admissionNumber = generateAdmissionNumber();

      const admission = await Admission.create({
        user_id: req.userId,
        student_name: value.studentName,
        father_name: value.fatherName,
        father_occupation: value.fatherOccupation,
        father_contact: value.fatherContact,
        mother_name: value.motherName,
        mother_occupation: value.motherOccupation,
        mother_contact: value.motherContact,
        whatsapp_contact: value.whatsappContact,
        email: value.email,
        date_of_birth: value.dateOfBirth,
        gender: value.gender,
        religion: value.religion,
        caste: value.caste,
        aadhaar_number: value.aadhaarNumber,
        blood_group: value.bloodGroup,
        corresponding_address: value.correspondingAddress,
        corresponding_district: value.correspondingDistrict,
        corresponding_pin: value.correspondingPin,
        corresponding_state: value.correspondingState,
        permanent_address: value.permanentAddress,
        permanent_district: value.permanentDistrict,
        permanent_pin: value.permanentPin,
        permanent_state: value.permanentState,
        admission_class: value.admissionClass,
        academic_year: value.academicYear,
        form_number: formNumber,
        admission_number: admissionNumber,
        admission_date: new Date(),
        photo_url: req.file ? `/uploads/${req.file.filename}` : null,
        status: 'pending'
      });

      await sendAdmissionConfirmation(value.email, value.studentName, admissionNumber);

      logger.info(`Admission submitted: ${admission.id} - Form: ${formNumber}`);

      res.status(201).json({
        success: true,
        message: 'Admission form submitted successfully',
        data: admission
      });
    } catch (error) {
      logger.error('Admission submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit admission',
        error: error.message
      });
    }
  }

  static async getMyAdmissions(req, res) {
    try {
      const admissions = await Admission.findByUserId(req.userId);

      res.status(200).json({
        success: true,
        data: admissions
      });
    } catch (error) {
      logger.error('Fetch admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admissions'
      });
    }
  }

  static async getAdmissionByEmailOrPhone(req, res) {
    try {
      const { email, phone } = req.query;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone is required'
        });
      }

      const admissions = await Admission.findByEmailOrPhone(email, phone);

      res.status(200).json({
        success: true,
        data: admissions
      });
    } catch (error) {
      logger.error('Fetch admissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admissions'
      });
    }
  }

  static async getAdmissionById(req, res) {
    try {
      const admission = await Admission.findById(req.params.id);

      if (!admission || admission.user_id !== req.userId) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      res.status(200).json({
        success: true,
        data: admission
      });
    } catch (error) {
      logger.error('Fetch admission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch admission'
      });
    }
  }

  static async updateAdmission(req, res) {
    try {
      const admission = await Admission.findById(req.params.id);

      if (!admission || admission.user_id !== req.userId) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      if (admission.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update admission that is not in pending status'
        });
      }

      const updated = await Admission.update(req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Admission updated successfully',
        data: updated
      });
    } catch (error) {
      logger.error('Update admission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update admission'
      });
    }
  }
}

module.exports = AdmissionController;
