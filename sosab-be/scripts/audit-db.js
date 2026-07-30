const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    // Pre-load models
    require('../models/Project');
    require('../models/Supplier');
    require('../models/Material');
    require('../models/MaterialLog');
    require('../models/User');
    require('../models/AuditLog');
    require('../models/Notification');
    require('../models/Worker');
    require('../models/Attendance');
    require('../models/Task');
    require('../models/Salary');
    require('../models/DailyReport');
    require('../models/MaterialRequest');
    require('../models/Announcement');
    
    const db = mongoose.connection.db;
    
    // ========== 1. LIST ALL COLLECTIONS AND THEIR DOCUMENT COUNTS ==========
    console.log('═'.repeat(90));
    console.log(' DATABASE OVERVIEW - All Collections');
    console.log('═'.repeat(90));
    
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        const icon = count === 0 ? '⚠️ ' : '  ';
        console.log(`${icon}${col.name.padEnd(30)} ${count} documents`);
    }
    
    // ========== 2. CHECK AUDIT LOGS (last 7 days) ==========
    console.log('\n');
    console.log('═'.repeat(90));
    console.log(' AUDIT LOGS - Last 7 Days');
    console.log('═'.repeat(90));
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const AuditLog = mongoose.model('AuditLog');
    const logs = await AuditLog.find({ 
        createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: -1 }).populate('userId', 'name email').lean();
    
    if (logs.length === 0) {
        console.log('No audit logs found in the last 7 days.');
        
        // Check if there are ANY audit logs
        const totalLogs = await AuditLog.countDocuments();
        console.log(`Total audit logs in DB: ${totalLogs}`);
        
        if (totalLogs > 0) {
            const latestLogs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(20).populate('userId', 'name email').lean();
            console.log(`\nMost recent ${latestLogs.length} logs (any date):`);
            console.log('─'.repeat(90));
            latestLogs.forEach(log => {
                const date = log.createdAt ? new Date(log.createdAt).toISOString() : 'N/A';
                const user = log.userId?.email || log.userId || 'unknown';
                const action = log.action || 'N/A';
                const resource = log.resource || 'N/A';
                const details = log.details ? JSON.stringify(log.details).substring(0, 60) : '';
                console.log(`[${date}] ${String(user).padEnd(25)} ${action.padEnd(20)} ${resource.padEnd(15)} ${details}`);
            });
        }
    } else {
        console.log(`Found ${logs.length} audit log entries:\n`);
        console.log('─'.repeat(90));
        
        // Group by day
        const byDay = {};
        logs.forEach(log => {
            const day = new Date(log.createdAt).toLocaleDateString();
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(log);
        });
        
        for (const [day, dayLogs] of Object.entries(byDay)) {
            console.log(`\n📅 ${day} (${dayLogs.length} actions)`);
            console.log('─'.repeat(70));
            dayLogs.forEach(log => {
                const time = new Date(log.createdAt).toLocaleTimeString();
                const user = log.userId?.email || log.userId || 'unknown';
                const action = log.action || 'N/A';
                const resource = log.resource || 'N/A';
                const details = log.details ? JSON.stringify(log.details).substring(0, 80) : '';
                const ip = log.ipAddress || '';
                console.log(`  ${time} | ${String(user).padEnd(25)} | ${action.padEnd(20)} | ${resource.padEnd(15)} | ${ip}`);
                if (details) console.log(`           ${details}`);
            });
        }
        
        // Look for DELETE actions specifically
        const deleteActions = logs.filter(l => 
            l.action && (l.action.toLowerCase().includes('delete') || l.action.toLowerCase().includes('remove'))
        );
        if (deleteActions.length > 0) {
            console.log('\n\n🔴 DELETE/REMOVE ACTIONS FOUND:');
            console.log('═'.repeat(90));
            deleteActions.forEach(log => {
                const date = new Date(log.createdAt).toISOString();
                const user = log.userId?.email || log.userId || 'unknown';
                console.log(`[${date}] User: ${user} | Action: ${log.action} | Resource: ${log.resource}`);
                if (log.details) console.log(`  Details: ${JSON.stringify(log.details)}`);
                if (log.ipAddress) console.log(`  IP: ${log.ipAddress}`);
                if (log.userAgent) console.log(`  UA: ${log.userAgent}`);
            });
        }
    }
    
    // ========== 3. CHECK ALL REMAINING DATA ==========
    console.log('\n\n');
    console.log('═'.repeat(90));
    console.log(' REMAINING DATA IN EACH COLLECTION');
    console.log('═'.repeat(90));
    
    // Check each important collection
    const importantCollections = ['users', 'projects', 'workers', 'materials', 'materiallogs', 'materialrequests',
        'attendances', 'salaries', 'tasks', 'dailyreports', 'notifications', 'suppliers', 'announcements'];
    
    for (const colName of importantCollections) {
        try {
            const docs = await db.collection(colName).find({}).limit(5).toArray();
            const total = await db.collection(colName).countDocuments();
            if (total > 0) {
                console.log(`\n✅ ${colName}: ${total} documents`);
                docs.forEach(d => {
                    // Show summary of each doc
                    const summary = {};
                    if (d.name) summary.name = d.name;
                    if (d.email) summary.email = d.email;
                    if (d.role) summary.role = d.role;
                    if (d.status) summary.status = d.status;
                    if (d.action) summary.action = d.action;
                    if (d.createdAt) summary.createdAt = new Date(d.createdAt).toISOString();
                    if (d.title) summary.title = d.title;
                    console.log(`   ${JSON.stringify(summary)}`);
                });
                if (total > 5) console.log(`   ... and ${total - 5} more`);
            } else {
                console.log(`\n⚠️  ${colName}: EMPTY (0 documents)`);
            }
        } catch(e) {
            // Collection might not exist
        }
    }

    // ========== 4. CHECK MONGODB ATLAS BACKUP INFO ==========
    console.log('\n\n');
    console.log('═'.repeat(90));
    console.log(' RECOVERY OPTIONS');
    console.log('═'.repeat(90));
    console.log('MongoDB Atlas (your database host) has automatic backups.');
    console.log('To restore data:');
    console.log('1. Go to https://cloud.mongodb.com');
    console.log('2. Navigate to your cluster "sosab"');
    console.log('3. Click "Backup" tab');
    console.log('4. Look for snapshots from before 2 days ago');
    console.log('5. Click "Restore" on a snapshot from when data was intact');
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
