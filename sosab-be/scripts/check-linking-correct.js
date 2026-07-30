const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const workers = await db.collection('workers').find({}).project({ _id: 1, name: 1 }).toArray();
    const projects = await db.collection('projects').find({}).project({ _id: 1, name: 1 }).toArray();
    
    const workerIdSet = new Set(workers.map(w => w._id.toString()));
    const projectIdSet = new Set(projects.map(p => p._id.toString()));
    
    const attendances = await db.collection('attendances').find({}).toArray();
    const salaries = await db.collection('salaries').find({}).toArray();
    
    let validAttWorkers = 0;
    let orphanAttWorkers = 0;
    const attDeletedWorkerIds = new Set();
    
    attendances.forEach(a => {
        const wId = a.workerId ? a.workerId.toString() : (a.worker ? a.worker.toString() : null);
        if (wId && workerIdSet.has(wId)) {
            validAttWorkers++;
        } else if (wId) {
            orphanAttWorkers++;
            attDeletedWorkerIds.add(wId);
        }
    });
    
    let validSalWorkers = 0;
    let orphanSalWorkers = 0;
    const salDeletedWorkerIds = new Set();
    
    salaries.forEach(s => {
        const wId = s.workerId ? s.workerId.toString() : (s.worker ? s.worker.toString() : null);
        if (wId && workerIdSet.has(wId)) {
            validSalWorkers++;
        } else if (wId) {
            orphanSalWorkers++;
            salDeletedWorkerIds.add(wId);
        }
    });
    
    console.log('=====================================================');
    console.log(' ATTENDANCE & SALARY LINKING REPORT (CORRECT FIELDS)');
    console.log('=====================================================\n');
    console.log(`Total Attendance Records: ${attendances.length}`);
    console.log(`  - Linked to existing workers: ${validAttWorkers}`);
    console.log(`  - Linked to deleted workers:  ${orphanAttWorkers}`);
    console.log(`  - Unique deleted worker IDs referenced in Attendance: ${attDeletedWorkerIds.size}`);
    
    console.log(`\nTotal Salary Records: ${salaries.length}`);
    console.log(`  - Linked to existing workers: ${validSalWorkers}`);
    console.log(`  - Linked to deleted workers:  ${orphanSalWorkers}`);
    console.log(`  - Unique deleted worker IDs referenced in Salary: ${salDeletedWorkerIds.size}`);
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
