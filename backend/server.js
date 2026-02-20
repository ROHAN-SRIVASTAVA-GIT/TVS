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
const feeRoutes = require('./routes/fee.routes');
const paymentRoutes = require('./routes/payment.routes');
const galleryRoutes = require('./routes/gallery.routes');
const noticeRoutes = require('./routes/notice.routes');
const contactRoutes = require('./routes/contact.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
  logger.info('Uploads directory created');
}

// Trust proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet());
app.use(compression());

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
app.use('/api/admission', admissionRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);

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

    await User.createTable();
    await Student.createTable();
    await Admission.createTable();
    await FeeStructure.createTable();
    await Payment.createTable();
    await Gallery.createTable();
    await Notice.createTable();
    await Contact.createTable();

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
