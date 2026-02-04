const fs = require('fs').promises;
const path = require('path');
const Report = require('../models/Report');

/**
 * Deletes report files older than the specified number of hours
 * @param {number} hours - Age threshold in hours (default: 24)
 */
const cleanupOldReports = async (hours = 24) => {
    try {
        const reportsDir = path.join(__dirname, '../uploads/reports');

        // Check if reports directory exists
        try {
            await fs.access(reportsDir);
        } catch (error) {
            console.log('Reports directory does not exist yet. Skipping cleanup.');
            return;
        }

        const now = Date.now();
        const maxAge = hours * 60 * 60 * 1000; // Convert hours to milliseconds

        // Get all files in reports directory
        const files = await fs.readdir(reportsDir);
        let deletedCount = 0;
        let errorCount = 0;

        console.log(`[Cleanup] Starting cleanup of reports older than ${hours} hours...`);

        for (const file of files) {
            const filePath = path.join(reportsDir, file);

            try {
                const stats = await fs.stat(filePath);

                // Check if file is older than threshold
                if (now - stats.mtime.getTime() > maxAge) {
                    // Delete the file
                    await fs.unlink(filePath);
                    deletedCount++;

                    // Also remove from database
                    const fileUrl = `/uploads/reports/${file}`;
                    await Report.deleteOne({ pdfUrl: fileUrl });

                    console.log(`[Cleanup] Deleted: ${file} (age: ${Math.round((now - stats.mtime.getTime()) / (1000 * 60 * 60))} hours)`);
                }
            } catch (error) {
                console.error(`[Cleanup] Error processing ${file}:`, error.message);
                errorCount++;
            }
        }

        console.log(`[Cleanup] Cleanup complete. Deleted ${deletedCount} files. Errors: ${errorCount}`);
        return { deletedCount, errorCount };

    } catch (error) {
        console.error('[Cleanup] Error during cleanup:', error);
        throw error;
    }
};

/**
 * Deletes all reports (for testing or manual cleanup)
 */
const cleanupAllReports = async () => {
    try {
        const reportsDir = path.join(__dirname, '../uploads/reports');
        const files = await fs.readdir(reportsDir);

        for (const file of files) {
            await fs.unlink(path.join(reportsDir, file));
        }

        await Report.deleteMany({});

        console.log(`[Cleanup] Deleted all ${files.length} reports`);
        return files.length;
    } catch (error) {
        console.error('[Cleanup] Error cleaning all reports:', error);
        throw error;
    }
};

module.exports = {
    cleanupOldReports,
    cleanupAllReports
};
