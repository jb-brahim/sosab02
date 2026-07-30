const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    const workers = await db.collection('workers').find({}).toArray();
    
    console.log(`========================================================================================`);
    console.log(` WORKER ROLES & JOB CATEGORIES ANALYSIS (${workers.length} Workers Total)`);
    console.log(`========================================================================================\n`);
    
    // Group workers by role/specialty
    const rolesMap = {};
    
    workers.forEach(w => {
        const role = w.role || w.specialty || w.job || w.position || 'Worker (General)';
        if (!rolesMap[role]) rolesMap[role] = [];
        rolesMap[role].push(w);
    });
    
    console.log('ROLES SUMMARY:');
    console.log('─'.repeat(70));
    for (const [role, list] of Object.entries(rolesMap)) {
        console.log(`- ${role.padEnd(30)}: ${list.length} workers`);
    }
    
    console.log('\n\nFULL WORKER ROLES & RATES LIST:');
    console.log('─'.repeat(90));
    console.log(`${'Worker Name'.padEnd(30)} ${'Role / Specialty'.padEnd(25)} ${'Daily Rate'.padEnd(15)} ${'Phone / Note'}`);
    console.log('─'.repeat(90));
    
    workers.forEach(w => {
        const name = w.name || 'Unnamed';
        const role = w.role || w.specialty || 'Worker';
        const rate = w.dailyRate ? `${w.dailyRate} TND` : 'N/A';
        const contact = w.phone || w.cin || w.notes || '';
        console.log(`${name.padEnd(30)} ${role.padEnd(25)} ${rate.padEnd(15)} ${contact}`);
    });

    // Check Worker Schema fields to see if any other fields exist
    console.log('\n\nALL SAMPLE WORKER DOCUMENT KEYS:');
    if (workers.length > 0) {
        console.log(Object.keys(workers[0]));
        console.log('Sample Document:');
        console.log(JSON.stringify(workers[0], null, 2));
    }

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
