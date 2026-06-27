const mongoose = require('mongoose');
const Worker = require('../models/Worker');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
let envPath = path.resolve(__dirname, '../.env.production');
if (!fs.existsSync(envPath)) {
    envPath = path.resolve(__dirname, '../.env');
}
dotenv.config({ path: envPath });

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sosab';
        await mongoose.connect(uri);
        console.log('Connected to Database');

        const workers = await Worker.find();
        console.log('Total workers in DB:', workers.length);
        workers.forEach(w => {
            console.log(`Worker: ${w.name} | ID: ${w._id} | Active: ${w.active}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
