const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const AdmZip = require('adm-zip');
const { sendNotificationEmail } = require('../utils/emailService');

const OWNER_EMAIL = 'brahimjaballi0@gmail.com';

// Ensure backups directory exists
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Function to perform a complete database backup and send ZIP to owner email
const performDatabaseBackup = async (label = '') => {
    try {
        const db = mongoose.connection.db || (mongoose.connection.client && mongoose.connection.client.db());
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

        // Create ZIP archive of the backup folder
        const zipPath = `${targetFolder}.zip`;
        const zip = new AdmZip();
        zip.addLocalFolder(targetFolder);
        zip.writeZip(zipPath);

        console.log(`[AutoBackup] 📦 Backup ZIP created at: ${zipPath}`);

        // Email ZIP archive to brahimjaballi0@gmail.com
        try {
            const formattedDate = new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            await sendNotificationEmail(
                OWNER_EMAIL,
                `📦 Sauvegarde Base de Données SOSAB - ${formattedDate}`,
                `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8;">
                    <h2 style="color: #0f172a; margin-bottom: 8px;">📦 Sauvegarde de la Base de Données SOSAB</h2>
                    <p style="color: #475569; font-size: 14px;">Bonjour <strong>Propriétaire SOSAB</strong>,</p>
                    <p style="color: #475569; font-size: 14px;">Votre sauvegarde instantanée de la base de données a été générée avec succès le <strong>${formattedDate}</strong>.</p>
                    
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #cbd5e1; margin: 15px 0;">
                        <p style="margin: 0; color: #1e293b; font-weight: bold; font-size: 14px;">Résumé du contenu (Anti-Sabotage) :</p>
                        <ul style="color: #334155; font-size: 13px; margin-top: 8px; padding-left: 20px;">
                            <li><strong>Collections sauvegardées :</strong> ${collections.length}</li>
                            <li><strong>Nombre total d'enregistrements :</strong> ${backupMeta.totalRecords.toLocaleString()}</li>
                            <li><strong>Fichier joint :</strong> <code>${folderName}.zip</code></li>
                        </ul>
                    </div>

                    <p style="color: #64748b; font-size: 12px; margin-top: 20px; font-style: italic;">
                        Ce fichier ZIP contient les données complètes au format JSON (Chantiers, Ouvriers, Pointages, Matériaux, Salaires, Comptes).
                    </p>
                </div>
                `,
                [
                    {
                        filename: `${folderName}.zip`,
                        path: zipPath
                    }
                ]
            );
            console.log(`[AutoBackup] ✉️ Backup ZIP email successfully sent to ${OWNER_EMAIL}`);
        } catch (emailErr) {
            console.error(`[AutoBackup] ⚠️ Email delivery warning:`, emailErr.message);
        }

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
        const files = fs.readdirSync(BACKUP_DIR);
        const cutoffTime = Date.now() - (maxDays * 24 * 60 * 60 * 1000);

        files.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);

            if (file.startsWith('backup-') && stats.mtimeMs < cutoffTime) {
                if (stats.isDirectory()) {
                    fs.rmSync(filePath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(filePath);
                }
                console.log(`[AutoBackup] 🧹 Purged old backup item: ${file}`);
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
