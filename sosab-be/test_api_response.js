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
    
    // Simulate the controller logic
    const userId = '6a3f9659f229776cf54d9580';
    let query = { userId };
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);
      
    console.log('--- API RESPONSE SIMULATION ---');
    console.log(JSON.stringify({
      success: true,
      count: notifications.length,
      data: notifications.map(n => ({
        _id: n._id,
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        link: n.link,
        createdAt: n.createdAt
      }))
    }, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
