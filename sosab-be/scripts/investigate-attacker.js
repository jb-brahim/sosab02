const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    require('../models/User');
    require('../models/AuditLog');
    
    const db = mongoose.connection.db;
    const AuditLog = mongoose.model('AuditLog');
    
    console.log('=====================================================');
    console.log(' FULL AUDIT TRAIL FOR IP: 160.156.251.54');
    console.log('=====================================================\n');
    
    const logsFromIP = await AuditLog.find({ ipAddress: '160.156.251.54' })
        .sort({ createdAt: 1 })
        .populate('userId', 'name email role')
        .lean();
    
    console.log(`Total log entries from 160.156.251.54: ${logsFromIP.length}\n`);
    
    logsFromIP.forEach(log => {
        const time = new Date(log.createdAt).toISOString();
        const user = log.userId ? `${log.userId.name} (${log.userId.email})` : 'Unauthenticated/Deleted';
        console.log(`[${time}] Action: ${log.action.padEnd(15)} Resource: ${(log.resource || '').padEnd(15)} User: ${user} UA: ${log.userAgent}`);
    });
    
    // Check all distinct IPs that have EVER logged into the system
    console.log('\n=====================================================');
    console.log(' ALL DISTINCT IPs IN AUDIT LOG');
    console.log('=====================================================\n');
    
    const allIPs = await AuditLog.distinct('ipAddress');
    for (const ip of allIPs) {
        const count = await AuditLog.countDocuments({ ipAddress: ip });
        const lastLog = await AuditLog.findOne({ ipAddress: ip }).sort({ createdAt: -1 }).populate('userId', 'name email').lean();
        const user = lastLog?.userId ? `${lastLog.userId.name} (${lastLog.userId.email})` : 'Unknown';
        console.log(`IP: ${String(ip).padEnd(20)} Total Actions: ${String(count).padEnd(6)} Last User: ${user} (${lastLog?.userAgent})`);
    }

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
