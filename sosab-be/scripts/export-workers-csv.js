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
    
    // Project map
    const projectMap = {};
    projects.forEach(p => {
        projectMap[p._id.toString()] = p.name;
    });
    
    // Project statistics on attendance
    let totalAttWithExistingProject = 0;
    let totalAttWithDeletedProject = 0;
    const projectAttCounts = {};
    
    attendances.forEach(a => {
        const pId = a.projectId ? a.projectId.toString() : (a.project ? a.project.toString() : null);
        if (pId) {
            if (projectMap[pId]) {
                totalAttWithExistingProject++;
                const pName = projectMap[pId];
                projectAttCounts[pName] = (projectAttCounts[pName] || 0) + 1;
            } else {
                totalAttWithDeletedProject++;
                const pName = `Deleted Project (${pId})`;
                projectAttCounts[pName] = (projectAttCounts[pName] || 0) + 1;
            }
        }
    });
    
    // Map attendance per worker
    const attendanceByWorker = {};
    attendances.forEach(a => {
        const wId = (a.workerId || a.worker || '').toString();
        if (!attendanceByWorker[wId]) {
            attendanceByWorker[wId] = { totalDays: 0, presentDays: 0, overtime: 0, bonus: 0, projects: new Set() };
        }
        attendanceByWorker[wId].totalDays++;
        if (a.present) attendanceByWorker[wId].presentDays++;
        if (a.overtime) attendanceByWorker[wId].overtime += a.overtime;
        if (a.bonus) attendanceByWorker[wId].bonus += a.bonus;
        
        const pId = a.projectId ? a.projectId.toString() : (a.project ? a.project.toString() : null);
        if (pId) {
            const pName = projectMap[pId] || `Deleted Project (${pId.substring(0, 8)}...)`;
            attendanceByWorker[wId].projects.add(pName);
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

    // Prepare CSV rows
    const csvHeader = 'Worker ID,Worker Name,Role,Daily Rate (TND),Assigned Project,Attendance Projects,Total Attendance Days,Days Present,Overtime Hours,Total Salary (TND)\n';
    const csvRows = [];
    
    workers.forEach(w => {
        const wId = w._id.toString();
        const name = `"${(w.name || 'Unnamed').replace(/"/g, '""')}"`;
        const role = `"${(w.role || 'Worker').replace(/"/g, '""')}"`;
        const rate = w.dailyRate || 0;
        
        let proj = 'Unassigned';
        if (w.project && projectMap[w.project.toString()]) proj = projectMap[w.project.toString()];
        if (w.projectId && projectMap[w.projectId.toString()]) proj = projectMap[w.projectId.toString()];
        const projEscaped = `"${proj.replace(/"/g, '""')}"`;
        
        const att = attendanceByWorker[wId] || { totalDays: 0, presentDays: 0, overtime: 0, bonus: 0, projects: new Set() };
        const sal = salaryByWorker[wId] || { totalSalary: 0, count: 0 };
        
        const attProjects = att.projects.size > 0 ? `"${[...att.projects].join('; ').replace(/"/g, '""')}"` : 'None';
        
        csvRows.push(`${wId},${name},${role},${rate},${projEscaped},${attProjects},${att.totalDays},${att.presentDays},${att.overtime},${sal.totalSalary.toFixed(2)}`);
    });
    
    const csvContent = csvHeader + csvRows.join('\n');
    const outputPath = path.join(__dirname, 'workers_full_history.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log('=====================================================');
    console.log(' PROJECT BREAKDOWN OF ATTENDANCE');
    console.log('=====================================================\n');
    console.log(`Total Attendance Records: ${attendances.length}`);
    console.log(`  - Linked to Existing Projects: ${totalAttWithExistingProject}`);
    console.log(`  - Linked to Deleted Projects:  ${totalAttWithDeletedProject}\n`);
    
    console.log('Attendance Breakdown by Project:');
    for (const [pName, count] of Object.entries(projectAttCounts)) {
        console.log(`   * ${pName.padEnd(45)}: ${count} days`);
    }
    
    console.log(`\n✅ CSV exported successfully to: ${outputPath}`);

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
