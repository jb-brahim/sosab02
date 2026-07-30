const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    // Pre-load all models
    require('../models/Project');
    require('../models/Supplier');
    require('../models/Material');
    require('../models/MaterialLog');
    const User = require('../models/User');
    
    // ========== ALL USERS ==========
    const users = await User.find({}).select('name email role active assignedProjects').populate('assignedProjects', 'name').lean();
    
    console.log('═'.repeat(90));
    console.log(' ALL USERS');
    console.log('═'.repeat(90));
    console.log(`${'Name'.padEnd(25)} ${'Email'.padEnd(30)} ${'Role'.padEnd(20)} ${'Active'.padEnd(8)}`);
    console.log('─'.repeat(90));
    users.forEach(u => {
        const active = u.active === false ? '❌' : '✅';
        console.log(`${(u.name || 'N/A').padEnd(25)} ${(u.email || 'N/A').padEnd(30)} ${(u.role || 'N/A').padEnd(20)} ${active}`);
        if (u.assignedProjects && u.assignedProjects.length > 0) {
            console.log(`  → Projects: ${u.assignedProjects.map(p => p.name || p).join(', ')}`);
        }
    });
    console.log(`\nTotal users: ${users.length}`);
    
    // ========== MATERIALS ==========
    console.log('\n');
    
    // Find the Material model
    let Material;
    try {
        Material = require('../models/Material');
    } catch(e) {
        // Try alternative names
        try { Material = mongoose.model('Material'); } catch(e2) {}
    }
    
    if (Material) {
        const materials = await Material.find({}).populate('project', 'name').populate('supplier', 'name').lean();
        
        console.log('═'.repeat(90));
        console.log(' ALL MATERIALS');
        console.log('═'.repeat(90));
        
        if (materials.length === 0) {
            console.log('No materials found in database.');
        } else {
            console.log(`${'Name'.padEnd(25)} ${'Project'.padEnd(20)} ${'Qty'.padEnd(10)} ${'Unit'.padEnd(8)} ${'Status'.padEnd(15)}`);
            console.log('─'.repeat(90));
            materials.forEach(m => {
                const project = m.project?.name || 'N/A';
                const qty = m.quantity !== undefined ? String(m.quantity) : 'N/A';
                const unit = m.unit || 'N/A';
                const status = m.status || 'N/A';
                console.log(`${(m.name || 'N/A').padEnd(25)} ${project.padEnd(20)} ${qty.padEnd(10)} ${unit.padEnd(8)} ${status.padEnd(15)}`);
                if (m.supplier?.name) console.log(`  → Supplier: ${m.supplier.name}`);
                if (m.unitPrice) console.log(`  → Unit Price: ${m.unitPrice} TND`);
            });
        }
        console.log(`\nTotal materials: ${materials.length}`);
    } else {
        console.log('Material model not found. Checking collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name).join(', '));
        
        // Try to query raw collection
        for (const col of collections) {
            if (col.name.toLowerCase().includes('material')) {
                const docs = await mongoose.connection.db.collection(col.name).find({}).toArray();
                console.log(`\n${col.name}: ${docs.length} documents`);
                docs.forEach(d => console.log(JSON.stringify(d, null, 2)));
            }
        }
    }
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Failed:', err.message);
    process.exit(1);
});
