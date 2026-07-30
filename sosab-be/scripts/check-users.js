const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

const uri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB...');

mongoose.connect(uri).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const User = require('../models/User');
    
    // Get all users
    const users = await User.find({}).select('name email role active createdAt').lean();
    
    console.log(`Found ${users.length} users:\n`);
    console.log('─'.repeat(90));
    console.log(`${'Name'.padEnd(25)} ${'Email'.padEnd(30)} ${'Role'.padEnd(20)} ${'Active'.padEnd(8)}`);
    console.log('─'.repeat(90));
    
    users.forEach(u => {
        const active = u.active === false ? '❌ NO' : '✅ YES';
        console.log(`${(u.name || 'N/A').padEnd(25)} ${(u.email || 'N/A').padEnd(30)} ${(u.role || 'N/A').padEnd(20)} ${active}`);
    });
    
    console.log('─'.repeat(90));
    
    // Check specifically for disabled accounts
    const disabled = users.filter(u => u.active === false);
    if (disabled.length > 0) {
        console.log(`\n⚠️  ${disabled.length} DISABLED accounts found:`);
        disabled.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    } else {
        console.log('\n✅ All accounts are active');
    }
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Failed to connect:', err.message);
    process.exit(1);
});
