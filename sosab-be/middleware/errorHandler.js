// Error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with more details
  console.error('Error:', {
    name: err.name,
    message: err.message,
    code: err.code,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = {
      message,
      statusCode: 400,
      errorCode: 'INVALID_ID'
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = {
      message,
      statusCode: 400,
      errorCode: 'DUPLICATE_FIELD',
      field
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401,
      errorCode: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401,
      errorCode: 'TOKEN_EXPIRED'
    };
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    errorCode: error.errorCode || 'SERVER_ERROR',
    ...(error.field && { field: error.field }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.name
    })
  });
};

module.exports = errorHandler;

