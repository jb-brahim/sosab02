// Load env vars
const dotenv = require('dotenv');
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

if (envFile && fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

const User = require('../models/User');

// Initialize default admin user
const initAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@sosab.com' });

    if (!adminExists) {
      if (!process.env.ADMIN_PASSWORD) {
        console.warn('⚠ Warning: ADMIN_PASSWORD not set in environment. Skipping default admin user creation.');
        return;
      }

      await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@sosab.com',
        password: process.env.ADMIN_PASSWORD,
        role: 'Admin',
        active: true
      });

      console.log('✓ Default admin user created successfully');
      console.log(`  Email: ${process.env.ADMIN_EMAIL || 'admin@sosab.com'}`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

module.exports = initAdmin;

