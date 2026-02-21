const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const fs = require('fs');
require('dotenv').config();

const logger = require('./config/logger');
const { db } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth.routes');
const admissionRoutes = require('./routes/admission.routes');
const admissionPaymentRoutes = require('./routes/admissionPayment.routes');
const feeRoutes = require('./routes/fee.routes');
const paymentRoutes = require('./routes/payment.routes');
const galleryRoutes = require('./routes/gallery.routes');
const noticeRoutes = require('./routes/notice.routes');
const contactRoutes = require('./routes/contact.routes');
const adminRoutes = require('./routes/admin.routes');
const otpRoutes = require('./routes/otp.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
  logger.info('Uploads directory created');
}

if (!fs.existsSync('uploads/gallery')) {
  fs.mkdirSync('uploads/gallery', { recursive: true });
  logger.info('Gallery uploads directory created');
}

// Trust proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(compression());

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://tvs.vercel.app',
  'https://tvs-frontend.vercel.app',
  'https://topviewpublicschool.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging Middleware
app.use(morgan('combined', { stream: logger.stream }));

// Rate Limiting
app.use('/api/auth/login', rateLimiter.loginLimiter);
app.use('/api/auth/register', rateLimiter.registerLimiter);
app.use('/api/payments/verify', rateLimiter.paymentVerifyLimiter);
app.use('/api/', rateLimiter.globalLimiter);

// Static Files
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admission-payment', admissionPaymentRoutes);
app.use('/api/admission', admissionRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/otp', otpRoutes);

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error Handling Middleware
app.use(errorHandler);

// Database Connection
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    logger.info('✓ Database connected successfully');

    // Initialize database tables
    await initializeTables();

    // Create admin user if not exists
    const createAdminUser = require('./scripts/createAdminUser');
    await createAdminUser();

    // Start server
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✓ Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log('\n========================================');
      console.log('Top View Public School - Backend Started');
      console.log('========================================');
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log('========================================\n');
    });
  } catch (error) {
    logger.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize Database Tables
async function initializeTables() {
  try {
    const User = require('./models/User');
    const Student = require('./models/Student');
    const Admission = require('./models/Admission');
    const FeeStructure = require('./models/FeeStructure');
    const Payment = require('./models/Payment');
    const Gallery = require('./models/Gallery');
    const Notice = require('./models/Notice');
    const Contact = require('./models/Contact');
    const OTP = require('./models/OTP');
    const AdmissionPayment = require('./models/AdmissionPayment');

    await User.createTable();
    await Student.createTable();
    await Admission.createTable();
    await AdmissionPayment.createTable();
    await FeeStructure.createTable();
    await Payment.createTable();
    await Gallery.createTable();
    await Notice.createTable();
    await Contact.createTable();
    await OTP.createTable();

    // Seed demo data
    try {
      const { db } = require('./config/db');
      const academicYear = new Date().getFullYear().toString();
      const feeStructures = [
        { className: 'NUR', tuitionFee: 15000, transportFee: 5000, uniformFee: 2500, examFee: 1000, activityFee: 1500 },
        { className: 'LKG', tuitionFee: 15000, transportFee: 5000, uniformFee: 2500, examFee: 1000, activityFee: 1500 },
        { className: 'UKG', tuitionFee: 15000, transportFee: 5000, uniformFee: 2500, examFee: 1000, activityFee: 1500 },
        { className: 'I', tuitionFee: 18000, transportFee: 6000, uniformFee: 3000, examFee: 1200, activityFee: 1800 },
        { className: 'II', tuitionFee: 18000, transportFee: 6000, uniformFee: 3000, examFee: 1200, activityFee: 1800 },
        { className: 'III', tuitionFee: 18000, transportFee: 6000, uniformFee: 3000, examFee: 1200, activityFee: 1800 },
        { className: 'IV', tuitionFee: 20000, transportFee: 7000, uniformFee: 3500, examFee: 1500, activityFee: 2000 },
        { className: 'V', tuitionFee: 20000, transportFee: 7000, uniformFee: 3500, examFee: 1500, activityFee: 2000 },
        { className: 'VI', tuitionFee: 25000, transportFee: 8000, uniformFee: 4000, examFee: 2000, activityFee: 2500 },
        { className: 'VII', tuitionFee: 25000, transportFee: 8000, uniformFee: 4000, examFee: 2000, activityFee: 2500 },
        { className: 'VIII', tuitionFee: 28000, transportFee: 9000, uniformFee: 4500, examFee: 2500, activityFee: 3000 },
      ];
      for (const fee of feeStructures) {
        const totalFee = fee.tuitionFee + fee.transportFee + fee.uniformFee + fee.examFee + fee.activityFee;
        await db.query(
          `INSERT INTO fee_structures (class_name, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee, academic_year, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
           ON CONFLICT DO NOTHING`,
          [fee.className, fee.tuitionFee, fee.transportFee, fee.uniformFee, fee.examFee, fee.activityFee, totalFee, academicYear]
        );
      }
      logger.info('✓ Demo fee structures seeded');
    } catch (err) {
      logger.warn('Demo data seeding note:', err.message);
    }

    logger.info('✓ Database tables initialized');
  } catch (error) {
    logger.warn('Database tables initialization note:', error.message);
  }
}

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  db.end();
  process.exit(0);
});

startServer();

module.exports = app;
