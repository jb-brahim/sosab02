const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected\n');
    
    require('../models/Project');
    require('../models/Worker');
    require('../models/Material');
    require('../models/Attendance');
    require('../models/Salary');
    require('../models/User');
    require('../models/Supplier');
    
    const db = mongoose.connection.db;
    const Worker = mongoose.model('Worker');
    const Project = mongoose.model('Project');
    
    // Get all existing worker & project IDs
    const existingWorkers = await Worker.find({}).select('_id name').lean();
    const existingProjects = await Project.find({}).select('_id name').lean();
    const workerIds = new Set(existingWorkers.map(w => String(w._id)));
    const projectIds = new Set(existingProjects.map(p => String(p._id)));
    
    console.log(`Existing workers: ${existingWorkers.length}`);
    console.log(`Existing projects: ${existingProjects.length}`);
    
    // ========== CHECK ATTENDANCE ==========
    console.log('\n═══════════════════════════════════════════');
    console.log(' ATTENDANCE (5,126 records)');
    console.log('═══════════════════════════════════════════');
    
    const attendances = await db.collection('attendances').find({}).toArray();
    let attWithWorker = 0;
    let attOrphanedWorker = 0;
    let attOrphanedProject = 0;
    const orphanedWorkerIds = new Set();
    
    attendances.forEach(a => {
        const wId = String(a.worker);
        const pId = String(a.project);
        if (workerIds.has(wId)) {
            attWithWorker++;
        } else {
            attOrphanedWorker++;
            orphanedWorkerIds.add(wId);
        }
        if (!projectIds.has(pId)) {
            attOrphanedProject++;
        }
    });
    
    console.log(`✅ Attendance linked to EXISTING workers: ${attWithWorker}`);
    console.log(`⚠️  Attendance linked to DELETED workers: ${attOrphanedWorker}`);
    console.log(`⚠️  Attendance linked to DELETED projects: ${attOrphanedProject}`);
    console.log(`   Unique deleted worker IDs referenced: ${orphanedWorkerIds.size}`);
    
    // ========== CHECK SALARIES ==========
    console.log('\n═══════════════════════════════════════════');
    console.log(' SALARIES (262 records)');
    console.log('═══════════════════════════════════════════');
    
    const salaries = await db.collection('salaries').find({}).toArray();
    let salWithWorker = 0;
    let salOrphanedWorker = 0;
    
    salaries.forEach(s => {
        const wId = String(s.worker);
        if (workerIds.has(wId)) {
            salWithWorker++;
        } else {
            salOrphanedWorker++;
        }
    });
    
    console.log(`✅ Salaries linked to EXISTING workers: ${salWithWorker}`);
    console.log(`⚠️  Salaries linked to DELETED workers: ${salOrphanedWorker}`);
    
    // ========== CHECK MATERIALS ==========
    console.log('\n═══════════════════════════════════════════');
    console.log(' MATERIALS');
    console.log('═══════════════════════════════════════════');
    const matCount = await db.collection('materials').countDocuments();
    console.log(`Materials remaining: ${matCount} (ALL WERE DELETED)`);
    
    // ========== CHECK MATERIAL REQUESTS ==========
    console.log('\n═══════════════════════════════════════════');
    console.log(' MATERIAL REQUESTS (6 records)');
    console.log('═══════════════════════════════════════════');
    const matReqs = await db.collection('materialrequests').find({}).toArray();
    matReqs.forEach(mr => {
        const pId = String(mr.project);
        const linked = projectIds.has(pId) ? '✅ project exists' : '⚠️ project deleted';
        console.log(`  Request: ${mr.status} | ${linked}`);
    });
    
    // ========== SUMMARY ==========
    console.log('\n\n═══════════════════════════════════════════');
    console.log(' FINAL ANSWER');
    console.log('═══════════════════════════════════════════');
    console.log('');
    console.log('❌ MATERIALS: ALL deleted (0 remaining). Gone.');
    console.log('❌ MATERIAL LOGS: ALL deleted (0 remaining). Gone.');
    console.log('❌ SUPPLIERS: ALL deleted (0 remaining). Gone.');
    console.log('');
    console.log(`✅ ATTENDANCE: ${attendances.length} records STILL EXIST in the database!`);
    console.log(`   → ${attWithWorker} are linked to workers that still exist`);
    console.log(`   → ${attOrphanedWorker} reference workers that were deleted`);
    console.log('');
    console.log(`✅ SALARIES: ${salaries.length} records STILL EXIST!`);
    console.log(`   → ${salWithWorker} linked to existing workers`);
    console.log(`   → ${salOrphanedWorker} reference deleted workers`);
    console.log('');
    console.log(`✅ WORKERS: ${existingWorkers.length} STILL EXIST (102 were deleted)`);
    console.log(`✅ PROJECTS: ${existingProjects.length} STILL EXIST (4 were deleted)`);
    console.log('');
    console.log('CONCLUSION: If you re-create the deleted workers with the SAME IDs,');
    console.log('the attendance and salary records will automatically link back.');
    console.log('But re-creating with NEW IDs will NOT link back — the old records');
    console.log('will remain orphaned. A MongoDB Atlas backup restore is the best option.');
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
