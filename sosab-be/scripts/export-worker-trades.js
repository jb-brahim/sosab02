const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    const workers = await db.collection('workers').find({}).toArray();
    
    console.log(`========================================================================================`);
    console.log(` WORKER TRADES, SALARIES & CONTACTS (${workers.length} Workers Total)`);
    console.log(`========================================================================================\n`);
    
    // Distinct trades in database
    const distinctTrades = {};
    workers.forEach(w => {
        const t = w.trade || w.role || 'Unspecified Trade';
        if (!distinctTrades[t]) distinctTrades[t] = 0;
        distinctTrades[t]++;
    });
    
    console.log('DISTINCT TRADES / ROLES IN DATABASE:');
    console.log('─'.repeat(70));
    for (const [trade, count] of Object.entries(distinctTrades)) {
        console.log(`- ${trade.padEnd(35)}: ${count} workers`);
    }
    
    console.log('\n\nFULL WORKERS TRADE & CONTACT LIST:');
    console.log('─'.repeat(100));
    console.log(`${'Worker Name'.padEnd(30)} ${'Trade / Specialty'.padEnd(25)} ${'Daily Salary'.padEnd(18)} ${'Phone / Contact'}`);
    console.log('─'.repeat(100));
    
    const csvHeader = 'Worker ID,Worker Name,Trade / Specialty,Daily Salary (TND),Phone,Subcontractor,Active Status\n';
    const csvRows = [];
    
    workers.forEach(w => {
        const name = w.name || 'Unnamed';
        const trade = w.trade || w.role || 'Worker';
        const salary = w.dailySalary ? `${w.dailySalary} TND` : (w.dailyRate ? `${w.dailyRate} TND` : 'N/A');
        const phone = w.contact?.phone || w.phone || 'N/A';
        const sub = w.isSubcontractor ? 'Yes' : 'No';
        const active = w.active !== false ? 'Active' : 'Inactive';
        
        console.log(`${name.padEnd(30)} ${trade.padEnd(25)} ${salary.padEnd(18)} ${phone}`);
        
        const nameEsc = `"${name.replace(/"/g, '""')}"`;
        const tradeEsc = `"${trade.replace(/"/g, '""')}"`;
        csvRows.push(`${w._id},${nameEsc},${tradeEsc},${w.dailySalary || w.dailyRate || 0},${phone},${sub},${active}`);
    });

    const csvContent = csvHeader + csvRows.join('\n');
    const outputPath = path.join(__dirname, 'workers_trades_and_contacts.csv');
    fs.writeFileSync(outputPath, csvContent);
    
    console.log(`\n✅ Worker Trades CSV exported to: ${outputPath}`);

    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
