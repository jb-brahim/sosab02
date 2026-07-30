const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    const workers = await db.collection('workers').find({}).toArray();
    const projects = await db.collection('projects').find({}).toArray();
    const attendances = await db.collection('attendances').find({}).toArray();
    const salaries = await db.collection('salaries').find({}).toArray();
    
    // Project ID -> Project Name Map
    const projectMap = {};
    projects.forEach(p => {
        projectMap[p._id.toString()] = p.name;
    });
    
    // Map attendance per worker
    const attendanceByWorker = {};
    attendances.forEach(a => {
        const wId = (a.workerId || a.worker || '').toString();
        if (!attendanceByWorker[wId]) {
            attendanceByWorker[wId] = { totalDays: 0, presentDays: 0, overtime: 0, bonus: 0, projectIds: new Set() };
        }
        attendanceByWorker[wId].totalDays++;
        if (a.present) attendanceByWorker[wId].presentDays++;
        if (a.overtime) attendanceByWorker[wId].overtime += a.overtime;
        if (a.bonus) attendanceByWorker[wId].bonus += a.bonus;
        
        const pId = a.projectId ? a.projectId.toString() : (a.project ? a.project.toString() : null);
        if (pId) {
            attendanceByWorker[wId].projectIds.add(pId);
        }
    });
    
    // Map salary per worker
    const salaryByWorker = {};
    salaries.forEach(s => {
        const wId = (s.workerId || s.worker || '').toString();
        if (!salaryByWorker[wId]) {
            salaryByWorker[wId] = { totalSalary: 0, count: 0 };
        }
        salaryByWorker[wId].totalSalary += (s.totalSalary || 0);
        salaryByWorker[wId].count++;
    });

    // Group workers by Project
    const grouped = {};
    
    workers.forEach(w => {
        const wId = w._id.toString();
        
        // Determine primary project for worker
        let pId = w.project ? w.project.toString() : (w.projectId ? w.projectId.toString() : null);
        
        // If not in worker document, check attendance records for worker
        if (!pId || pId === 'null') {
            const att = attendanceByWorker[wId];
            if (att && att.projectIds.size > 0) {
                pId = [...att.projectIds][0]; // Pick main project from attendance
            }
        }
        
        let projectName = 'Unassigned Workers';
        if (pId) {
            if (projectMap[pId]) {
                projectName = `Project: ${projectMap[pId]}`;
            } else {
                projectName = `Deleted Project [ID: ${pId}]`;
            }
        }
        
        if (!grouped[projectName]) grouped[projectName] = [];
        
        const att = attendanceByWorker[wId] || { totalDays: 0, presentDays: 0, overtime: 0, bonus: 0 };
        const sal = salaryByWorker[wId] || { totalSalary: 0, count: 0 };
        
        grouped[projectName].push({
            id: wId,
            name: w.name || 'Unnamed Worker',
            role: w.role || 'Worker',
            rate: w.dailyRate || 0,
            totalDays: att.totalDays,
            presentDays: att.presentDays,
            overtime: att.overtime,
            totalSalary: sal.totalSalary
        });
    });

    // Build Grouped CSV output
    const lines = [];
    lines.push('========================================================================================');
    lines.push('SOSAB TRACKER - WORKERS GROUPED BY PROJECT (INCLUDING DELETED PROJECTS)');
    lines.push('========================================================================================');
    lines.push('');

    let grandTotalWorkers = 0;
    let grandTotalAttendance = 0;
    let grandTotalSalary = 0;

    for (const [groupTitle, workerList] of Object.entries(grouped)) {
        lines.push(`\n"### ${groupTitle.toUpperCase()} (${workerList.length} Workers)"`);
        lines.push('Worker ID,Worker Name,Role,Daily Rate (TND),Attendance Days,Days Present,Overtime Hours,Total Salary (TND)');
        
        let projAtt = 0;
        let projSal = 0;
        
        workerList.forEach(w => {
            projAtt += w.totalDays;
            projSal += w.totalSalary;
            
            const name = `"${w.name.replace(/"/g, '""')}"`;
            const role = `"${w.role.replace(/"/g, '""')}"`;
            lines.push(`${w.id},${name},${role},${w.rate},${w.totalDays},${w.presentDays},${w.overtime},${w.totalSalary.toFixed(2)}`);
        });
        
        lines.push(`"SUBTOTAL FOR ${groupTitle.toUpperCase()}",,,,"${projAtt} Days",,,"${projSal.toFixed(2)} TND"`);
        lines.push(''); // blank row between groups
        
        grandTotalWorkers += workerList.length;
        grandTotalAttendance += projAtt;
        grandTotalSalary += projSal;
    }
    
    lines.push('========================================================================================');
    lines.push(`"GRAND TOTALS",,,"","${grandTotalWorkers} Workers","${grandTotalAttendance} Total Days",,"${grandTotalSalary.toFixed(2)} TND"`);
    lines.push('========================================================================================');

    const csvContent = lines.join('\n');
    const outputPath = path.join(__dirname, 'workers_grouped_by_project.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`✅ Successfully generated grouped CSV: ${outputPath}`);
    console.log(`Summary:`);
    for (const [groupTitle, workerList] of Object.entries(grouped)) {
        console.log(`   - ${groupTitle.padEnd(50)}: ${workerList.length} workers`);
    }

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
