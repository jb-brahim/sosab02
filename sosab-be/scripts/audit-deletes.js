const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('Connected to MongoDB\n');
    
    require('../models/Project');
    require('../models/Supplier');
    require('../models/Material');
    require('../models/User');
    require('../models/AuditLog');
    
    const db = mongoose.connection.db;
    const AuditLog = mongoose.model('AuditLog');
    
    // Count DELETE actions by resource and date
    const deleteActions = await AuditLog.find({ 
        action: 'delete'
    }).sort({ createdAt: -1 }).populate('userId', 'name email').lean();
    
    console.log(`Total DELETE actions in audit log: ${deleteActions.length}\n`);
    
    // Group by resource type
    const byResource = {};
    deleteActions.forEach(d => {
        const r = d.resource || 'unknown';
        if (!byResource[r]) byResource[r] = { count: 0, dates: [], ips: new Set(), uas: new Set() };
        byResource[r].count++;
        byResource[r].dates.push(new Date(d.createdAt).toISOString());
        if (d.ipAddress) byResource[r].ips.add(d.ipAddress);
        if (d.userAgent) byResource[r].uas.add(d.userAgent);
    });
    
    console.log('DELETE ACTIONS SUMMARY BY RESOURCE:');
    console.log('─'.repeat(70));
    for (const [resource, info] of Object.entries(byResource)) {
        console.log(`\n🔴 ${resource}: ${info.count} deletions`);
        console.log(`   First: ${info.dates[info.dates.length - 1]}`);
        console.log(`   Last:  ${info.dates[0]}`);
        console.log(`   IPs:   ${[...info.ips].join(', ')}`);
        console.log(`   User-Agents: ${[...info.uas].join(', ')}`);
    }
    
    // Show the FIRST delete actions (when it started)
    console.log('\n\n FIRST 10 DELETE ACTIONS (when the attack started):');
    console.log('─'.repeat(70));
    const firstDeletes = deleteActions.slice(-10).reverse();
    firstDeletes.forEach(log => {
        const date = new Date(log.createdAt).toISOString();
        const user = log.userId?.email || 'unknown';
        console.log(`[${date}] ${user} deleted ${log.resource} | IP: ${log.ipAddress} | UA: ${log.userAgent}`);
    });
    
    // Check for login from that IP
    console.log('\n\n LOGINS FROM SUSPICIOUS IPs:');
    console.log('─'.repeat(70));
    const suspiciousIPs = new Set();
    deleteActions.forEach(d => { if (d.ipAddress) suspiciousIPs.add(d.ipAddress); });
    
    const suspiciousLogins = await AuditLog.find({
        action: 'login',
        ipAddress: { $in: [...suspiciousIPs] }
    }).sort({ createdAt: 1 }).populate('userId', 'name email').lean();
    
    suspiciousLogins.forEach(log => {
        const date = new Date(log.createdAt).toISOString();
        const user = log.userId?.email || 'unknown';
        console.log(`[${date}] ${user} logged in from IP: ${log.ipAddress} | UA: ${log.userAgent}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
