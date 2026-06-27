const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
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

        const logs = await AuditLog.find({ resource: 'Attendance' }).sort({ createdAt: -1 }).limit(10);
        console.log(`Total attendance logs: ${logs.length}`);
        logs.forEach(l => {
            console.log(`Log ID: ${l._id} | Action: ${l.action} | Resource: ${l.resource}`);
            console.log(`Changes:`, JSON.stringify(l.changes, null, 2));
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
