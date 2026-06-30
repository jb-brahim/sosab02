const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');

// Load env
let envFile = '.env.production';
if (!fs.existsSync(envFile)) {
  envFile = '.env';
}
dotenv.config({ path: envFile });

const Notification = require('./models/Notification');
const connectDB = require('./config/db');

async function test() {
  try {
    await connectDB();
    console.log('Connected to DB');
    
    const notifs = await Notification.find({ userId: '6a3f9659f229776cf54d9580' }).sort({ createdAt: -1 });
    console.log(`--- NOTIFICATIONS FOR owner@sosab.com (Count: ${notifs.length}) ---`);
    notifs.forEach(n => {
      console.log(`Title: ${n.title} | Type: ${n.type} | Message: ${n.message} | CreatedAt: ${n.createdAt}`);
    });
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
