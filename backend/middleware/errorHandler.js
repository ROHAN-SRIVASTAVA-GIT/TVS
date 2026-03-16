const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  logger.error(`Error: ${err.message}`, {
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    type: err.type || err.name,
  });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    err.message = 'File too large. Maximum size is 100MB';
    err.statusCode = 413;
  }
  if (err.code === 'LIMIT_FIELD_SIZE') {
    err.message = 'Field too large';
    err.statusCode = 413;
  }
  if (err.code === 'LIMIT_PART_COUNT') {
    err.message = 'Too many parts in form data';
    err.statusCode = 413;
  }

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err.message = message;
    err.statusCode = 400;
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    err.message = message;
    err.statusCode = 401;
  }

  // JWT Expire error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    err.message = message;
    err.statusCode = 401;
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

module.exports = errorHandler;
