const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
const Report = require('../models/Report');

// Clean up PDFs older than 24 hours
const cleanupOldPDFs = async () => {
  try {
    console.log('Starting PDF cleanup...');

    const reportsDir = path.join(__dirname, '../uploads/reports');
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    let deletedCount = 0;
    let errorCount = 0;

    // Check if directory exists
    try {
      await fs.access(reportsDir);
    } catch (error) {
      console.log('Reports directory does not exist, skipping cleanup');
      return;
    }

    // Get all files in reports directory (excluding test directory)
    const files = await fs.readdir(reportsDir, { withFileTypes: true });

    for (const file of files) {
      // Skip directories and test folder
      if (file.isDirectory() || file.name === 'test') {
        continue;
      }

      const filePath = path.join(reportsDir, file.name);

      try {
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtimeMs;

        // Delete files older than 24 hours
        if (fileAge > twentyFourHours) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`Deleted old PDF: ${file.name} (age: ${Math.round(fileAge / (60 * 60 * 1000))} hours)`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error.message);
        errorCount++;
      }
    }

    // Also clean up database records for reports older than 24 hours
    let deletedReportsCount = 0;
    try {
      const cutoffDate = new Date(now - twentyFourHours);
      const deletedReports = await Report.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      deletedReportsCount = deletedReports.deletedCount;
    } catch (dbError) {
      // If database is not connected, skip database cleanup
      console.log('  Note: Database cleanup skipped (database not connected)');
    }

    console.log(`PDF cleanup completed:`);
    console.log(`  - Files deleted: ${deletedCount}`);
    console.log(`  - Database records deleted: ${deletedReportsCount}`);
    console.log(`  - Errors: ${errorCount}`);

  } catch (error) {
    console.error('Error in PDF cleanup:', error);
  }
};

// Schedule cleanup to run once per day at midnight
const schedulePDFCleanup = () => {
  // Run cleanup every day at midnight (00:00)
  // Cron format: minute hour day month weekday
  // '0 0 * * *' means: at minute 0, hour 0, every day
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduled] Running daily report cleanup...');
    await cleanupOldPDFs();
  });

  // Also run immediately on startup to clean any old files
  cleanupOldPDFs();

  console.log('✓ Report cleanup scheduler initialized (runs daily at midnight)');
};

// Export both functions
module.exports = schedulePDFCleanup;
module.exports.cleanupOldPDFs = cleanupOldPDFs;
module.exports.schedulePDFCleanup = schedulePDFCleanup;

