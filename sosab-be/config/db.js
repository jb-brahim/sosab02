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

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

