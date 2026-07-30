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
    
    const projectMap = {};
    projects.forEach(p => {
        projectMap[p._id.toString()] = p.name;
    });
    
    // Group attendance date ranges and weeks per worker
    const workerDateSummary = {};
    
    attendances.forEach(a => {
        const wId = (a.workerId || a.worker || '').toString();
        if (!wId) return;
        
        if (!workerDateSummary[wId]) {
            workerDateSummary[wId] = {
                dates: [],
                minDate: null,
                maxDate: null,
                presentDays: 0,
                totalDays: 0,
                overtimeHours: 0,
                bonusTotal: 0,
                projects: new Set()
            };
        }
        
        const summary = workerDateSummary[wId];
        summary.totalDays++;
        if (a.present) summary.presentDays++;
        if (a.overtime) summary.overtimeHours += a.overtime;
        if (a.bonus) summary.bonusTotal += a.bonus;
        
        if (a.date) {
            const d = new Date(a.date);
            if (!isNaN(d.getTime())) {
                summary.dates.push(d);
                if (!summary.minDate || d < summary.minDate) summary.minDate = d;
                if (!summary.maxDate || d > summary.maxDate) summary.maxDate = d;
            }
        }
        
        const pId = a.projectId ? a.projectId.toString() : (a.project ? a.project.toString() : null);
        if (pId) {
            const pName = projectMap[pId] || `Deleted Project [${pId.substring(0, 8)}...]`;
            summary.projects.add(pName);
        }
    });
    
    // Map salary info
    const salaryMap = {};
    salaries.forEach(s => {
        const wId = (s.workerId || s.worker || '').toString();
        if (!salaryMap[wId]) {
            salaryMap[wId] = { totalPaid: 0, weeks: new Set() };
        }
        salaryMap[wId].totalPaid += (s.totalSalary || 0);
        if (s.week) salaryMap[wId].weeks.add(s.week);
    });

    // Helper for formatting date (YYYY-MM-DD)
    const fmt = (d) => d ? d.toISOString().split('T')[0] : 'N/A';
    
    // Helper to calculate total active weeks span
    const getWeekSpan = (minD, maxD) => {
        if (!minD || !maxD) return 'N/A';
        const diffMs = maxD - minD;
        const weeks = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7));
        return weeks === 0 ? '1 week' : `${weeks} weeks`;
    };

    // CSV Headers
    const csvHeader = 'Worker ID,Worker Name,Role,Daily Rate (TND),Project(s),First Attendance Date,Last Attendance Date,Active Time Span,Total Attendance Days,Days Present,Overtime Hours,Salary Weeks Recorded,Total Salary (TND)\n';
    const csvRows = [];
    
    // Overall date range across ALL attendance
    let overallMin = null;
    let overallMax = null;
    
    attendances.forEach(a => {
        if (a.date) {
            const d = new Date(a.date);
            if (!isNaN(d.getTime())) {
                if (!overallMin || d < overallMin) overallMin = d;
                if (!overallMax || d > overallMax) overallMax = d;
            }
        }
    });
    
    console.log('=====================================================');
    console.log(' OVERALL SYSTEM ATTENDANCE TIMELINE');
    console.log('=====================================================\n');
    console.log(`Earliest Attendance Recorded: ${fmt(overallMin)}`);
    console.log(`Latest Attendance Recorded:   ${fmt(overallMax)}`);
    console.log(`Total Time Range Covered:    ${getWeekSpan(overallMin, overallMax)}\n`);
    
    workers.forEach(w => {
        const wId = w._id.toString();
        const name = `"${(w.name || 'Unnamed Worker').replace(/"/g, '""')}"`;
        const role = `"${(w.role || 'Worker').replace(/"/g, '""')}"`;
        const rate = w.dailyRate || 0;
        
        const summary = workerDateSummary[wId] || {
            dates: [], minDate: null, maxDate: null, presentDays: 0, totalDays: 0, overtimeHours: 0, bonusTotal: 0, projects: new Set()
        };
        const sal = salaryMap[wId] || { totalPaid: 0, weeks: new Set() };
        
        let projName = 'Unassigned';
        if (w.project && projectMap[w.project.toString()]) projName = projectMap[w.project.toString()];
        if (w.projectId && projectMap[w.projectId.toString()]) projName = projectMap[w.projectId.toString()];
        if (summary.projects.size > 0) projName = [...summary.projects].join('; ');
        const projEscaped = `"${projName.replace(/"/g, '""')}"`;
        
        const firstDate = fmt(summary.minDate);
        const lastDate = fmt(summary.maxDate);
        const weekSpan = getWeekSpan(summary.minDate, summary.maxDate);
        const weeksList = sal.weeks.size > 0 ? `"${[...sal.weeks].join('; ').replace(/"/g, '""')}"` : 'N/A';
        
        csvRows.push(`${wId},${name},${role},${rate},${projEscaped},${firstDate},${lastDate},${weekSpan},${summary.totalDays},${summary.presentDays},${summary.overtimeHours},${weeksList},${sal.totalPaid.toFixed(2)}`);
    });

    const csvContent = csvHeader + csvRows.join('\n');
    const outputPath = path.join(__dirname, 'workers_attendance_with_dates.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`✅ CSV exported with full dates & weeks: ${outputPath}`);

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
