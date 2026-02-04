const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
let envFile = null;
if (process.env.NODE_ENV) {
    envFile = `.env.${process.env.NODE_ENV}`;
} else {
    if (fs.existsSync('.env.development')) {
        envFile = '.env.development';
    } else if (fs.existsSync('.env')) {
        envFile = '.env';
    }
}

if (envFile && fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
}

const User = require('../models/User');

const checkAndResetAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Find admin user
        const admin = await User.findOne({ email: 'admin@sosab.com' }).select('+password');

        if (!admin) {
            console.log('❌ Admin user not found!');
            console.log('Creating admin user...');

            await User.create({
                name: 'Admin',
                email: 'admin@sosab.com',
                password: 'Adminsosab',
                role: 'Admin',
                active: true
            });

            console.log('✓ Admin user created successfully');
            console.log('Email: admin@sosab.com');
            console.log('Password: Adminsosab');
        } else {
            console.log('✓ Admin user found');
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
            console.log('Active:', admin.active);
            console.log('Password hash:', admin.password);

            // Test password comparison
            const testPassword = 'Adminsosab';
            const isMatch = await bcrypt.compare(testPassword, admin.password);
            console.log(`\nPassword test for "${testPassword}":`, isMatch ? '✓ MATCH' : '❌ NO MATCH');

            // If password doesn't match, reset it
            if (!isMatch) {
                console.log('\n⚠️  Password mismatch detected. Resetting password...');
                admin.password = 'Adminsosab';
                await admin.save();
                console.log('✓ Password reset successfully to: Adminsosab');
            }
        }

        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkAndResetAdmin();
