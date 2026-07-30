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
    const attendances = await db.collection('attendances').find({}).sort({ projectId: 1, date: 1 }).toArray();
    
    // Map active project IDs
    const activeProjectMap = {};
    projects.forEach(p => {
        activeProjectMap[p._id.toString()] = p.name;
    });
    
    // Map worker details by worker ID
    const workerMap = {};
    workers.forEach(w => {
        workerMap[w._id.toString()] = {
            id: w._id.toString(),
            name: w.name || 'Unnamed Worker',
            trade: w.trade || w.role || 'Ouvrier',
            dailySalary: w.dailySalary || w.dailyRate || 0,
            projectId: w.projectId ? w.projectId.toString() : null
        };
    });

    // Group attendances by Project ID
    const groupedByProject = {};
    
    attendances.forEach(a => {
        const pId = a.projectId ? a.projectId.toString() : (a.project ? a.project.toString() : 'UNASSIGNED');
        const isDeleted = !activeProjectMap[pId];
        
        let projectLabel = '';
        if (activeProjectMap[pId]) {
            projectLabel = `ACTIVE PROJECT: ${activeProjectMap[pId]} [ID: ${pId}]`;
        } else if (pId !== 'UNASSIGNED') {
            projectLabel = `DELETED PROJECT [ID: ${pId}]`;
        } else {
            projectLabel = `UNASSIGNED PROJECT`;
        }
        
        if (!groupedByProject[projectLabel]) {
            groupedByProject[projectLabel] = [];
        }
        
        const wId = (a.workerId || a.worker || '').toString();
        const workerInfo = workerMap[wId] || {
            id: wId,
            name: 'Unknown / Deleted Worker',
            trade: 'Ouvrier',
            dailySalary: 0
        };
        
        const dateStr = a.date ? new Date(a.date).toISOString().split('T')[0] : 'N/A';
        const status = a.present ? 'PRESENT' : 'ABSENT';
        
        groupedByProject[projectLabel].push({
            projectId: pId,
            workerId: workerInfo.id,
            workerName: workerInfo.name,
            trade: workerInfo.trade,
            dailySalary: workerInfo.dailySalary,
            date: dateStr,
            status: status,
            overtime: a.overtime || 0,
            bonus: a.bonus || 0,
            penalty: a.penalty || 0,
            notes: a.notes || ''
        });
    });

    // Build Master CSV Content with Group Section Headers
    const csvLines = [];
    csvLines.push('========================================================================================');
    csvLines.push('SOSAB TRACKER - DETAILED DAILY ATTENDANCE REPORT GROUPED BY PROJECT ID');
    csvLines.push('========================================================================================');
    csvLines.push('');

    let grandTotalRecords = 0;

    for (const [projectTitle, records] of Object.entries(groupedByProject)) {
        csvLines.push(`"### ${projectTitle} (${records.length} Daily Attendance Records)"`);
        csvLines.push('Project ID,Worker ID,Worker Name,Job / Trade / Role,Daily Salary (TND),Date,Status,Overtime Hours,Bonus (TND),Penalty (TND),Notes');
        
        let presentCount = 0;
        let absentCount = 0;
        
        records.forEach(r => {
            if (r.status === 'PRESENT') presentCount++;
            else absentCount++;
            
            const wName = `"${r.workerName.replace(/"/g, '""')}"`;
            const trade = `"${r.trade.replace(/"/g, '""')}"`;
            const notes = `"${r.notes.replace(/"/g, '""')}"`;
            
            csvLines.push(`${r.projectId},${r.workerId},${wName},${trade},${r.dailySalary},${r.date},${r.status},${r.overtime},${r.bonus},${r.penalty},${notes}`);
        });
        
        csvLines.push(`"SUBTOTAL FOR ${projectTitle}",,,,,"Total: ${records.length} Days","Present: ${presentCount} | Absent: ${absentCount}",,,,`);
        csvLines.push(''); // Blank line between project sections
        
        grandTotalRecords += records.length;
    }
    
    csvLines.push('========================================================================================');
    csvLines.push(`"GRAND TOTAL DAILY RECORDS",,,,,"Total: ${grandTotalRecords} Attendance Entries Across All Projects",,,,,`);
    csvLines.push('========================================================================================');

    const csvContent = csvLines.join('\n');
    const outputPath = path.join(__dirname, 'deleted_projects_detailed_daily_attendance.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`✅ Successfully generated master detailed CSV: ${outputPath}`);
    console.log(`Summary of attendance records by project:`);
    for (const [pTitle, recs] of Object.entries(groupedByProject)) {
        console.log(`   - ${pTitle.padEnd(65)}: ${recs.length} records`);
    }

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
