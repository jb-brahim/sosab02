const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    const workers = await db.collection('workers').find({}).toArray();
    const projects = await db.collection('projects').find({}).toArray();
    const attendances = await db.collection('attendances').find({}).sort({ date: 1 }).toArray();
    
    // Project ID -> Project Object Map
    const projectMap = {};
    projects.forEach(p => {
        projectMap[p._id.toString()] = p.name;
    });
    
    // Map attendance by workerId
    const attendanceByWorker = {};
    attendances.forEach(a => {
        const wId = (a.workerId || a.worker || '').toString();
        if (!wId) return;
        if (!attendanceByWorker[wId]) attendanceByWorker[wId] = [];
        attendanceByWorker[wId].push(a);
    });
    
    // Group workers into the 8 Projects / Categories
    const projectGroups = {};

    workers.forEach(w => {
        const wId = w._id.toString();
        const workerAtts = attendanceByWorker[wId] || [];
        
        // Find main project for worker
        let pId = w.project ? w.project.toString() : (w.projectId ? w.projectId.toString() : null);
        
        if (!pId || pId === 'null') {
            if (workerAtts.length > 0) {
                const firstAtt = workerAtts.find(a => a.projectId || a.project);
                if (firstAtt) {
                    pId = (firstAtt.projectId || firstAtt.project).toString();
                }
            }
        }
        
        let groupTitle = '';
        if (pId && projectMap[pId]) {
            groupTitle = `PROJECT: ${projectMap[pId]} [ID: ${pId}]`;
        } else if (pId) {
            groupTitle = `DELETED PROJECT [ID: ${pId}]`;
        } else {
            groupTitle = `UNASSIGNED WORKERS`;
        }
        
        if (!projectGroups[groupTitle]) {
            projectGroups[groupTitle] = {
                projectId: pId || 'UNASSIGNED',
                projectName: projectMap[pId] || (pId ? `Deleted Project (${pId.substring(0, 8)}...)` : 'Unassigned'),
                workers: []
            };
        }
        
        projectGroups[groupTitle].workers.push({
            id: wId,
            name: w.name || 'Unnamed Worker',
            trade: w.trade || w.role || 'Ouvrier',
            dailySalary: w.dailySalary || w.dailyRate || 0,
            attendances: workerAtts
        });
    });

    // Build Master CSV Content
    const csvLines = [];
    csvLines.push('========================================================================================');
    csvLines.push('SOSAB TRACKER - COMPLETE ALL 8 PROJECTS & ALL 149 WORKERS DETAILED DAILY REPORT');
    csvLines.push('========================================================================================');
    csvLines.push('');

    let grandTotalWorkers = 0;
    let grandTotalAttendanceDays = 0;

    for (const [groupTitle, groupData] of Object.entries(projectGroups)) {
        const workerList = groupData.workers;
        
        let totalGroupAttDays = 0;
        workerList.forEach(w => totalGroupAttDays += w.attendances.length);
        
        csvLines.push(`"### ${groupTitle.toUpperCase()} (${workerList.length} Workers | ${totalGroupAttDays} Total Daily Attendance Logs)"`);
        csvLines.push('Project ID,Worker ID,Worker Name,Job / Trade / Role,Daily Salary (TND),Date,Status (PRESENT / ABSENT),Overtime Hours,Bonus (TND),Penalty (TND),Notes');
        
        workerList.forEach(w => {
            const wName = `"${w.name.replace(/"/g, '""')}"`;
            const trade = `"${w.trade.replace(/"/g, '""')}"`;
            
            if (w.attendances.length === 0) {
                // Worker has 0 daily attendance records, output 1 row showing worker details
                csvLines.push(`${groupData.projectId},${w.id},${wName},${trade},${w.dailySalary},N/A,NO_ATTENDANCE_RECORDED,0,0,0,"No daily attendance logged"`);
            } else {
                // Output every daily attendance record
                w.attendances.forEach(a => {
                    const dateStr = a.date ? new Date(a.date).toISOString().split('T')[0] : 'N/A';
                    const status = a.present ? 'PRESENT' : 'ABSENT';
                    const notes = `"${(a.notes || '').replace(/"/g, '""')}"`;
                    csvLines.push(`${groupData.projectId},${w.id},${wName},${trade},${w.dailySalary},${dateStr},${status},${a.overtime || 0},${a.bonus || 0},${a.penalty || 0},${notes}`);
                });
            }
        });
        
        csvLines.push(`"SUBTOTAL FOR ${groupTitle.toUpperCase()}",,,,,"Workers: ${workerList.length}","Total Attendance Logs: ${totalGroupAttDays}",,,,`);
        csvLines.push(''); // Blank line between project sections
        
        grandTotalWorkers += workerList.length;
        grandTotalAttendanceDays += totalGroupAttDays;
    }

    csvLines.push('========================================================================================');
    csvLines.push(`"GRAND TOTALS FOR ALL 8 PROJECTS",,,,,"Total Workers: ${grandTotalWorkers}","Total Attendance Logs: ${grandTotalAttendanceDays}",,,,`);
    csvLines.push('========================================================================================');

    const csvContent = csvLines.join('\n');
    const outputPath = path.join(__dirname, 'all_8_projects_complete_detailed_attendance.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`✅ Successfully generated master report for ALL 8 Projects: ${outputPath}`);
    console.log(`\nSummary by Project:`);
    for (const [groupTitle, groupData] of Object.entries(projectGroups)) {
        let totalAtt = 0;
        groupData.workers.forEach(w => totalAtt += w.attendances.length);
        console.log(`   - ${groupTitle.padEnd(65)}: ${groupData.workers.length} workers (${totalAtt} daily logs)`);
    }

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
