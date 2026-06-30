const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load env
let envFile = '.env.production';
if (!fs.existsSync(envFile)) {
  envFile = '.env';
}
dotenv.config({ path: envFile });

const User = require('./models/User');
const Notification = require('./models/Notification');
const connectDB = require('./config/db');

async function test() {
  try {
    await connectDB();
    console.log('Connected to DB');
    
    // Find an admin
    const admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      console.error('No admin found!');
      process.exit(1);
    }
    console.log('Found admin:', admin.name, 'ID:', admin._id, 'Active:', admin.active);
    
    const notif = await Notification.create({
      userId: admin._id,
      type: 'system',
      title: 'Test Title',
      message: 'Test message description',
      link: '/owner/logs',
      read: false
    });
    console.log('Notification created successfully:', notif);
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
  
  process.exit(0);
}

test();
