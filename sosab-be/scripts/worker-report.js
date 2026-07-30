const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    const workers = await db.collection('workers').find({}).toArray();
    const projects = await db.collection('projects').find({}).toArray();
    const attendances = await db.collection('attendances').find({}).toArray();
    const salaries = await db.collection('salaries').find({}).toArray();
    
    const projectMap = {};
    projects.forEach(p => {
        projectMap[p._id.toString()] = p.name;
    });
    
    // Map attendance by workerId
    const attendanceByWorker = {};
    attendances.forEach(a => {
        const wId = (a.workerId || a.worker || '').toString();
        if (!attendanceByWorker[wId]) {
            attendanceByWorker[wId] = { totalDays: 0, presentDays: 0, totalOvertime: 0, totalBonus: 0, projects: new Set() };
        }
        attendanceByWorker[wId].totalDays++;
        if (a.present) attendanceByWorker[wId].presentDays++;
        if (a.overtime) attendanceByWorker[wId].totalOvertime += a.overtime;
        if (a.bonus) attendanceByWorker[wId].totalBonus += a.bonus;
        if (a.projectId) {
            const pName = projectMap[a.projectId.toString()];
            if (pName) attendanceByWorker[wId].projects.add(pName);
        }
    });
    
    // Map salary by workerId
    const salaryByWorker = {};
    salaries.forEach(s => {
        const wId = (s.workerId || s.worker || '').toString();
        if (!salaryByWorker[wId]) {
            salaryByWorker[wId] = { totalAmount: 0, count: 0 };
        }
        salaryByWorker[wId].totalAmount += (s.totalSalary || 0);
        salaryByWorker[wId].count++;
    });
    
    console.log('========================================================================================');
    console.log(` WORKER HISTORY & RELATIONSHIPS REPORT (${workers.length} Workers Total)`);
    console.log('========================================================================================\n');
    
    console.log(`${'Worker Name'.padEnd(25)} ${'Role'.padEnd(18)} ${'Daily Rate'.padEnd(12)} ${'Project Assigned'.padEnd(25)} ${'Attendance Days'.padEnd(18)} ${'Total Paid (TND)'}`);
    console.log('─'.repeat(120));
    
    let totalPaidAllWorkers = 0;
    let totalAttendanceAllWorkers = 0;
    
    workers.forEach(w => {
        const wId = w._id.toString();
        const name = w.name || 'Unnamed';
        const role = w.role || 'Worker';
        const rate = w.dailyRate ? `${w.dailyRate} TND` : 'N/A';
        
        let projName = 'Unassigned';
        if (w.project && projectMap[w.project.toString()]) {
            projName = projectMap[w.project.toString()];
        } else if (w.projectId && projectMap[w.projectId.toString()]) {
            projName = projectMap[w.projectId.toString()];
        }
        
        const attInfo = attendanceByWorker[wId] || { totalDays: 0, presentDays: 0, projects: new Set() };
        const salInfo = salaryByWorker[wId] || { totalAmount: 0, count: 0 };
        
        if (attInfo.projects.size > 0 && projName === 'Unassigned') {
            projName = [...attInfo.projects].join(', ');
        }
        
        totalPaidAllWorkers += salInfo.totalAmount;
        totalAttendanceAllWorkers += attInfo.totalDays;
        
        console.log(`${name.padEnd(25)} ${role.padEnd(18)} ${rate.padEnd(12)} ${projName.padEnd(25)} ${String(attInfo.totalDays + ' days').padEnd(18)} ${salInfo.totalAmount.toFixed(2)} TND`);
    });
    
    console.log('─'.repeat(120));
    console.log(`TOTALS: ${workers.length} Workers | ${totalAttendanceAllWorkers} Total Attendance Days | ${totalPaidAllWorkers.toFixed(2)} TND Total Salaries`);

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
