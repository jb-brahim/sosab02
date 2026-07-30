const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    const sampleWorker = await db.collection('workers').findOne({});
    const sampleAttendance = await db.collection('attendances').findOne({});
    const sampleSalary = await db.collection('salaries').findOne({});
    
    console.log('Sample Worker _id:', sampleWorker ? sampleWorker._id : null, 'Type:', typeof sampleWorker._id);
    console.log('Sample Attendance worker ref:', sampleAttendance ? sampleAttendance.worker : null, 'Type:', typeof sampleAttendance.worker);
    console.log('Sample Salary worker ref:', sampleSalary ? sampleSalary.worker : null, 'Type:', typeof sampleSalary.worker);
    
    // Check if worker ref in attendance matches any worker _id using String comparison
    const workers = await db.collection('workers').find({}).project({ _id: 1 }).toArray();
    const workerIdStrings = new Set(workers.map(w => w._id.toString()));
    
    const attendances = await db.collection('attendances').find({}).project({ worker: 1 }).limit(20).toArray();
    console.log('\nFirst 5 Attendance worker refs vs worker list match:');
    attendances.slice(0, 10).forEach(a => {
        const wStr = a.worker ? a.worker.toString() : 'NULL';
        console.log(`Attendance worker ref: ${wStr} -> Match: ${workerIdStrings.has(wStr)}`);
    });

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
