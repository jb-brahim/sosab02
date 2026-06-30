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
    
    const user = await User.findOne({ email: 'owner@sosab.com' });
    if (user) {
      console.log(`User: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Push Subscriptions Count: ${user.pushSubscriptions ? user.pushSubscriptions.length : 0}`);
      console.log('Subscriptions:', JSON.stringify(user.pushSubscriptions, null, 2));
    } else {
      console.log('Owner user not found');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
