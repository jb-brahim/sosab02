const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load env vars - support .env.development, .env.production, etc.
// Try environment-specific file first, then fall back to .env
const fs = require('fs');
let envFile = null;

if (process.env.NODE_ENV) {
  envFile = `.env.${process.env.NODE_ENV}`;
} else {
  // Auto-detect: try .env.development first, then .env
  if (fs.existsSync('.env.development')) {
    envFile = '.env.development';
  } else if (fs.existsSync('.env')) {
    envFile = '.env';
  }
}

// Load environment-specific file if it exists
if (envFile && fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`✓ Loaded environment file: ${envFile}`);
  console.log('DEBUG: Loaded PORT:', process.env.PORT);
} else {
  console.warn('⚠ Warning: No .env file found. Using system environment variables only.');
}

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Initialize admin user
const initAdmin = require('./config/initAdmin');
initAdmin();

// Initialize app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files (PDF reports)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/material-requests', require('./routes/materialRequests'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/daily-reports', require('./routes/dailyReports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SOSAB Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


// Start weekly report scheduler
const scheduleWeeklyReports = require('./jobs/weeklyReports');
scheduleWeeklyReports();

// Start PDF cleanup scheduler (deletes PDFs older than 24 hours)
const schedulePDFCleanup = require('./jobs/cleanupOldPDFs');
schedulePDFCleanup();

// Start automated cron jobs (stock alerts, absences, weekly reports)
require('./jobs/cronJobs');

// Start server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;

