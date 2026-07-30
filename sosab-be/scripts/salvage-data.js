const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Raw queries to avoid schema errors
    const workers = await db.collection('workers').find({}).toArray();
    const projects = await db.collection('projects').find({}).toArray();
    const attendances = await db.collection('attendances').find({}).toArray();
    const salaries = await db.collection('salaries').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();
    const materials = await db.collection('materials').find({}).toArray();
    
    console.log('====================================================');
    console.log(' CURRENT DATABASE STATE SUMMARY');
    console.log('====================================================\n');
    
    console.log(`- Users: ${users.length}`);
    users.forEach(u => console.log(`   * ${u.name || u.email} (${u.email}) - ${u.role}`));
    
    console.log(`\n- Projects: ${projects.length}`);
    projects.forEach(p => console.log(`   * [ID: ${p._id}] ${p.name} - Status: ${p.status || 'N/A'}`));
    
    console.log(`\n- Workers: ${workers.length}`);
    const activeWorkers = workers.filter(w => w.status === 'Active' || !w.status);
    console.log(`   * Total: ${workers.length} (Active: ${activeWorkers.length})`);
    
    console.log(`\n- Materials: ${materials.length}`);
    console.log(`- Attendance Records: ${attendances.length}`);
    console.log(`- Salary Records: ${salaries.length}`);
    
    // Check links between Attendance & Workers
    const workerIdSet = new Set(workers.map(w => String(w._id)));
    const projectIdSet = new Set(projects.map(p => String(p._id)));
    
    let validAttWorker = 0;
    let orphanAttWorker = 0;
    
    attendances.forEach(a => {
        if (a.worker && workerIdSet.has(String(a.worker))) {
            validAttWorker++;
        } else {
            orphanAttWorker++;
        }
    });
    
    console.log(`\n- Attendance Worker Linking:`);
    console.log(`   * Linked to valid existing workers: ${validAttWorker}`);
    console.log(`   * Unlinked / Orphaned: ${orphanAttWorker}`);
    
    let validSalWorker = 0;
    let orphanSalWorker = 0;
    salaries.forEach(s => {
        if (s.worker && workerIdSet.has(String(s.worker))) {
            validSalWorker++;
        } else {
            orphanSalWorker++;
        }
    });
    
    console.log(`\n- Salary Worker Linking:`);
    console.log(`   * Linked to valid existing workers: ${validSalWorker}`);
    console.log(`   * Unlinked / Orphaned: ${orphanSalWorker}`);
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
