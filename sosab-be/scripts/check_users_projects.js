const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
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

        const users = await User.find().select('name role email assignedProjects');
        console.log('\n--- USERS IN DB ---');
        users.forEach(u => {
            console.log(`User: ${u.name} (${u.role}) - Email: ${u.email}`);
            console.log(`  assignedProjects (raw IDs):`, u.assignedProjects);
        });

        const projects = await Project.find().select('name managers');
        console.log('\n--- PROJECTS IN DB ---');
        projects.forEach(p => {
            console.log(`Project: ${p.name}`);
            console.log(`  managers (raw IDs):`, p.managers);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
