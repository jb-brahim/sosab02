const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { performDatabaseBackup } = require('../jobs/databaseBackup');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const runManualBackup = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sosab';
        console.log('Connecting to MongoDB for manual backup...');
        await mongoose.connect(uri);
        console.log('✓ Connected to MongoDB');

        const folder = await performDatabaseBackup('manual');
        
        await mongoose.disconnect();
        if (folder) {
            console.log(`\n🎉 Manual Database Backup Complete!\nSaved to: ${folder}`);
            process.exit(0);
        } else {
            console.error('\n❌ Backup failed.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Failed:', error.message);
        process.exit(1);
    }
};

runManualBackup();
