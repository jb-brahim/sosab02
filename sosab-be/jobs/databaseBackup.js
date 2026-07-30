const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Ensure backups directory exists
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Function to perform a complete database backup
const performDatabaseBackup = async (label = '') => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            console.warn('[AutoBackup] Database not connected. Skipping backup.');
            return null;
        }

        const dateStr = new Date().toISOString().replace(/:/g, '-').split('.')[0]; // YYYY-MM-DDTHH-MM-SS
        const folderName = label ? `backup-${label}-${dateStr}` : `backup-${dateStr}`;
        const targetFolder = path.join(BACKUP_DIR, folderName);

        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
        }

        const collections = await db.listCollections().toArray();
        const backupMeta = {
            timestamp: new Date().toISOString(),
            collections: {},
            totalRecords: 0
        };

        for (const col of collections) {
            const docs = await db.collection(col.name).find({}).toArray();
            const filePath = path.join(targetFolder, `${col.name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(docs));
            
            backupMeta.collections[col.name] = docs.length;
            backupMeta.totalRecords += docs.length;
        }

        // Save metadata file
        fs.writeFileSync(path.join(targetFolder, 'metadata.json'), JSON.stringify(backupMeta, null, 2));

        console.log(`[AutoBackup] ✅ Backup successfully created at: ${targetFolder} (${backupMeta.totalRecords} total records backed up across ${collections.length} collections)`);

        // Clean up backups older than 14 days to conserve disk space
        cleanOldBackups(14);

        return targetFolder;
    } catch (error) {
        console.error('[AutoBackup] ❌ Backup failed:', error.message);
        return null;
    }
};

// Clean up backups older than maxDays
const cleanOldBackups = (maxDays = 30) => {
    try {
        const folders = fs.readdirSync(BACKUP_DIR);
        const cutoffTime = Date.now() - (maxDays * 24 * 60 * 60 * 1000);

        folders.forEach(folder => {
            const folderPath = path.join(BACKUP_DIR, folder);
            const stats = fs.statSync(folderPath);

            if (stats.isDirectory() && folder.startsWith('backup-') && stats.mtimeMs < cutoffTime) {
                fs.rmSync(folderPath, { recursive: true, force: true });
                console.log(`[AutoBackup] 🧹 Purged old backup: ${folder}`);
            }
        });
    } catch (err) {
        console.error('[AutoBackup] Error cleaning old backups:', err.message);
    }
};

module.exports = {
    performDatabaseBackup,
    cleanOldBackups
};
