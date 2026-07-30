const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    require('../models/Project');
    require('../models/Supplier');
    require('../models/Material');
    require('../models/User');
    require('../models/AuditLog');
    
    const AuditLog = mongoose.model('AuditLog');
    
    // Count DELETE actions by resource
    const deleteActions = await AuditLog.find({ action: 'delete' }).lean();
    
    console.log(`TOTAL DELETE ACTIONS: ${deleteActions.length}\n`);
    
    const byResource = {};
    deleteActions.forEach(d => {
        const r = d.resource || 'unknown';
        if (!byResource[r]) byResource[r] = { count: 0, firstDate: null, lastDate: null, ips: new Set(), uas: new Set() };
        byResource[r].count++;
        const date = new Date(d.createdAt);
        if (!byResource[r].firstDate || date < byResource[r].firstDate) byResource[r].firstDate = date;
        if (!byResource[r].lastDate || date > byResource[r].lastDate) byResource[r].lastDate = date;
        if (d.ipAddress) byResource[r].ips.add(d.ipAddress);
        if (d.userAgent) byResource[r].uas.add(d.userAgent);
    });
    
    console.log('DELETE SUMMARY BY RESOURCE:');
    console.log('─'.repeat(70));
    for (const [resource, info] of Object.entries(byResource)) {
        console.log(`\n🔴 ${resource}: ${info.count} deletions`);
        console.log(`   Started:      ${info.firstDate.toISOString()}`);
        console.log(`   Ended:        ${info.lastDate.toISOString()}`);
        console.log(`   IPs:          ${[...info.ips].join(', ')}`);
        console.log(`   User-Agents:  ${[...info.uas].join('\n                 ')}`);
    }

    // Check for the python-requests deletes specifically
    const pythonDeletes = deleteActions.filter(d => d.userAgent && d.userAgent.includes('python'));
    console.log(`\n\n🚨 PYTHON SCRIPT DELETES: ${pythonDeletes.length}`);
    if (pythonDeletes.length > 0) {
        const first = new Date(Math.min(...pythonDeletes.map(d => new Date(d.createdAt)))).toISOString();
        const last = new Date(Math.max(...pythonDeletes.map(d => new Date(d.createdAt)))).toISOString();
        console.log(`   Time window: ${first} → ${last}`);
        const pyResources = {};
        pythonDeletes.forEach(d => {
            pyResources[d.resource] = (pyResources[d.resource] || 0) + 1;
        });
        console.log('   Resources deleted:');
        for (const [r, c] of Object.entries(pyResources)) {
            console.log(`     - ${r}: ${c} items`);
        }
    }
    
    // Check what user was used for the python deletes  
    if (pythonDeletes.length > 0) {
        const userIds = [...new Set(pythonDeletes.map(d => String(d.userId)))];
        const User = mongoose.model('User');
        for (const uid of userIds) {
            try {
                const u = await User.findById(uid).select('name email role');
                console.log(`   Account used: ${u ? u.email : uid} (${u ? u.role : 'deleted'})`);
            } catch(e) {
                console.log(`   Account used: ${uid}`);
            }
        }
    }
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
