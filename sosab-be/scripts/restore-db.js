const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '..', '.env') });
}

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

const runRestore = async () => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            console.error('❌ No backups directory found.');
            process.exit(1);
        }

        const folders = fs.readdirSync(BACKUP_DIR).filter(f => {
            return fs.statSync(path.join(BACKUP_DIR, f)).isDirectory() && f.startsWith('backup-');
        }).sort().reverse(); // Most recent first

        if (folders.length === 0) {
            console.error('❌ No backup snapshots found in backups directory.');
            process.exit(1);
        }

        // Get targeted backup folder from command argument or default to latest
        const targetFolderArg = process.argv[2];
        let selectedFolder = null;

        if (targetFolderArg) {
            const potentialPath = path.isAbsolute(targetFolderArg) ? targetFolderArg : path.join(BACKUP_DIR, targetFolderArg);
            if (fs.existsSync(potentialPath) && fs.statSync(potentialPath).isDirectory()) {
                selectedFolder = potentialPath;
            } else {
                console.error(`❌ Specified backup folder "${targetFolderArg}" not found.`);
                process.exit(1);
            }
        } else {
            selectedFolder = path.join(BACKUP_DIR, folders[0]); // Latest
        }

        console.log(`=====================================================`);
        console.log(` RESTORING DATABASE FROM SNAPSHOT:`);
        console.log(` ${selectedFolder}`);
        console.log(`=====================================================\n`);

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sosab';
        await mongoose.connect(uri);
        console.log('✓ Connected to MongoDB\n');

        const db = mongoose.connection.db;

        const files = fs.readdirSync(selectedFolder).filter(f => f.endsWith('.json') && f !== 'metadata.json');

        for (const file of files) {
            const colName = path.basename(file, '.json');
            const filePath = path.join(selectedFolder, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const docs = JSON.parse(content);

            console.log(`Restoring collection "${colName}" (${docs.length} documents)...`);

            // Clear collection before restore
            await db.collection(colName).deleteMany({});

            if (docs.length > 0) {
                // Convert string ObjectIds and Dates back to BSON types if necessary
                const bsonDocs = docs.map(d => {
                    if (d._id && typeof d._id === 'string' && d._id.length === 24) {
                        try { d._id = new mongoose.Types.ObjectId(d._id); } catch(e) {}
                    }
                    return d;
                });
                await db.collection(colName).insertMany(bsonDocs);
            }
        }

        console.log('\n🎉 DATABASE RESTORE COMPLETED SUCCESSFULLY!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Restore failed:', error.message);
        process.exit(1);
    }
};

runRestore();
