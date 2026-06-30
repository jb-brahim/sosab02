const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');

// Load env
let envFile = '.env.production';
if (!fs.existsSync(envFile)) {
  envFile = '.env';
}
dotenv.config({ path: envFile });

const User = require('./models/User');
const connectDB = require('./config/db');

async function test() {
  try {
    await connectDB();
    console.log('Connected to DB');
    
    const users = await User.find({}, 'name email role active');
    console.log('--- ALL USERS IN DB ---');
    users.forEach(u => {
      console.log(`Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Active: ${u.active} | ID: ${u._id}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
