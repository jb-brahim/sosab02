const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Find Achref Salhi
    const achrefId = '698dc21e90eab852f08eac07';
    const worker = await db.collection('workers').findOne({ _id: new mongoose.Types.ObjectId(achrefId) }) 
                   || await db.collection('workers').findOne({ name: /achref salhi/i });
    
    const targetId = worker ? worker._id.toString() : achrefId;
    const workerName = worker ? worker.name : 'Achref salhi';
    
    console.log(`========================================================================================`);
    console.log(` DAILY ATTENDANCE BREAKDOWN FOR: ${workerName} [ID: ${targetId}]`);
    console.log(`========================================================================================\n`);
    
    const attendances = await db.collection('attendances').find({
        $or: [
            { workerId: targetId },
            { workerId: new mongoose.Types.ObjectId(targetId) },
            { worker: targetId },
            { worker: new mongoose.Types.ObjectId(targetId) }
        ]
    }).sort({ date: 1 }).toArray();
    
    console.log(`Total Attendance Records Found: ${attendances.length}`);
    
    const presentDates = [];
    const absentDates = [];
    
    attendances.forEach(a => {
        const dStr = a.date ? new Date(a.date).toISOString().split('T')[0] : 'Unknown Date';
        if (a.present === true) {
            presentDates.push({ date: dStr, overtime: a.overtime || 0, bonus: a.bonus || 0, notes: a.notes || '' });
        } else {
            absentDates.push({ date: dStr, penalty: a.penalty || 0, notes: a.notes || '' });
        }
    });
    
    console.log(`\n✅ PRESENT: ${presentDates.length} Days`);
    console.log(`❌ ABSENT:  ${absentDates.length} Days\n`);
    
    console.log('────────────────────────────────────────────────────────────────────────────────────────');
    console.log('❌ ABSENT DATES:');
    console.log('────────────────────────────────────────────────────────────────────────────────────────');
    if (absentDates.length === 0) {
        console.log('  No absent days recorded.');
    } else {
        absentDates.forEach((ab, idx) => {
            console.log(`  ${idx + 1}. ${ab.date} ${ab.notes ? `(Note: ${ab.notes})` : ''}`);
        });
    }
    
    console.log('\n────────────────────────────────────────────────────────────────────────────────────────');
    console.log('✅ PRESENT DATES (First 20 and Last 20 sample):');
    console.log('────────────────────────────────────────────────────────────────────────────────────────');
    presentDates.slice(0, 15).forEach((pr, idx) => {
        const ot = pr.overtime > 0 ? ` [Overtime: +${pr.overtime}h]` : '';
        const bn = pr.bonus > 0 ? ` [Bonus: +${pr.bonus} TND]` : '';
        console.log(`  ${idx + 1}. ${pr.date}${ot}${bn}`);
    });
    if (presentDates.length > 30) {
        console.log(`  ... (${presentDates.length - 30} present days in between) ...`);
    }
    presentDates.slice(-15).forEach((pr, idx) => {
        const ot = pr.overtime > 0 ? ` [Overtime: +${pr.overtime}h]` : '';
        const bn = pr.bonus > 0 ? ` [Bonus: +${pr.bonus} TND]` : '';
        console.log(`  ${presentDates.length - 15 + idx + 1}. ${pr.date}${ot}${bn}`);
    });

    // Generate Full Daily CSV for Achref Salhi
    const csvHeader = 'Worker Name,Date,Status,Overtime Hours,Bonus (TND),Penalty (TND),Notes\n';
    const csvRows = attendances.map(a => {
        const dStr = a.date ? new Date(a.date).toISOString().split('T')[0] : 'N/A';
        const status = a.present ? 'PRESENT' : 'ABSENT';
        const ot = a.overtime || 0;
        const bn = a.bonus || 0;
        const pen = a.penalty || 0;
        const notes = `"${(a.notes || '').replace(/"/g, '""')}"`;
        return `"${workerName}",${dStr},${status},${ot},${bn},${pen},${notes}`;
    });
    
    const csvContent = csvHeader + csvRows.join('\n');
    const outputPath = path.join(__dirname, 'achref_salhi_daily_attendance.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`\n✅ Detailed Daily CSV for Achref Salhi exported to: ${outputPath}`);

    // ALSO BUILD A MASTER DAILY ATTENDANCE CSV FOR ALL WORKERS
    console.log('\nGenerating Master Daily Attendance CSV for ALL workers...');
    const allWorkers = await db.collection('workers').find({}).toArray();
    const workerMap = {};
    allWorkers.forEach(w => workerMap[w._id.toString()] = w.name || 'Unnamed');
    
    const allAttendances = await db.collection('attendances').find({}).sort({ date: -1 }).toArray();
    
    const masterCsvHeader = 'Worker ID,Worker Name,Date,Status,Overtime Hours,Bonus (TND),Penalty (TND)\n';
    const masterCsvRows = allAttendances.map(a => {
        const wId = (a.workerId || a.worker || '').toString();
        const wName = `"${(workerMap[wId] || 'Deleted/Unknown Worker').replace(/"/g, '""')}"`;
        const dStr = a.date ? new Date(a.date).toISOString().split('T')[0] : 'N/A';
        const status = a.present ? 'PRESENT' : 'ABSENT';
        return `${wId},${wName},${dStr},${status},${a.overtime || 0},${a.bonus || 0},${a.penalty || 0}`;
    });
    
    const masterPath = path.join(__dirname, 'master_daily_attendance_all_workers.csv');
    fs.writeFileSync(masterPath, masterCsvHeader + masterCsvRows.join('\n'));
    console.log(`✅ Master Daily CSV for ALL workers exported to: ${masterPath}`);

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
