const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@sosab.com' });

        if (existingAdmin) {
            console.log('Admin user already exists');
            console.log('Email: admin@sosab.com');
            console.log('Role:', existingAdmin.role);
            console.log('\nIf you forgot the password, delete this user from MongoDB and run this script again.');
            process.exit(0);
        }

        const password = process.env.ADMIN_PASSWORD;
        if (!password) {
            console.error('❌ Error: ADMIN_PASSWORD must be defined in environment variables.');
            process.exit(1);
        }

        // Create admin user
        const adminUser = await User.create({
            name: 'Admin SOSAB',
            email: process.env.ADMIN_EMAIL || 'admin@sosab.com',
            password: password,
            role: 'Admin',
            active: true
        });

        console.log('✅ Admin user created successfully!');
        console.log('\n📧 Account created:');
        console.log(`   Email: ${adminUser.email}`);
        console.log('   Role:', adminUser.role);

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
};

createAdminUser();
