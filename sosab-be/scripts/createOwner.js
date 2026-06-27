const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createOwnerUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if owner already exists
        const existingOwner = await User.findOne({ email: 'owner@sosab.com' });

        if (existingOwner) {
            console.log('Owner user already exists');
            console.log('Email: owner@sosab.com');
            console.log('Role:', existingOwner.role);
            console.log('\nIf you want to reset the password, delete the user or update it via script.');
            process.exit(0);
        }

        // Create owner user with Admin role in DB so it passes all backend middleware
        const ownerUser = await User.create({
            name: 'Propriétaire SOSAB',
            email: 'owner@sosab.com',
            password: 'owner123', // You can change this via Settings
            role: 'Admin',
            active: true
        });

        console.log('✅ Owner super user created successfully!');
        console.log('\n📧 Login credentials:');
        console.log('   Email: owner@sosab.com');
        console.log('   Password: owner123');
        console.log('   Role (DB):', ownerUser.role);
        console.log('\nUse these credentials in the login page. You will be automatically redirected to the new /owner portal.');

        process.exit(0);
    } catch (error) {
        console.error('Error creating owner user:', error);
        process.exit(1);
    }
};

createOwnerUser();
