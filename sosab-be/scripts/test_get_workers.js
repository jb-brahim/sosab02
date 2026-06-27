const mongoose = require('mongoose');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const User = require('../models/User');
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

        // Test the exact query used in getAllWorkers
        let query = { active: true };
        const workers = await Worker.find(query)
            .populate({
                path: 'projectId',
                select: 'name managerId',
                populate: {
                    path: 'managers',
                    select: 'name'
                }
            });

        console.log('Successfully fetched workers!');
        console.log('Count:', workers.length);
        if (workers.length > 0) {
            console.log('Sample worker:', JSON.stringify(workers[0], null, 2));
            const yassin = workers.find(w => w._id.toString() === '69dc9b45030dc7f0fa919da8');
            console.log('Found Yassin in query results:', yassin ? yassin.name : 'NOT FOUND');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error during query:', err);
        process.exit(1);
    }
};

run();
