require('dotenv').config();
const { cleanupOldPDFs } = require('../jobs/cleanupOldPDFs');
const fs = require('fs').promises;
const path = require('path');

// Test PDF cleanup functionality
async function testCleanup() {
  console.log('🧹 Testing PDF Cleanup Functionality...\n');

  const reportsDir = path.join(__dirname, '../uploads/reports');
  
  // Check if reports directory exists
  try {
    await fs.access(reportsDir);
  } catch (error) {
    console.log('❌ Reports directory does not exist');
    return;
  }

  // List current files
  console.log('📋 Current PDF files:');
  try {
    const files = await fs.readdir(reportsDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('   No PDF files found\n');
    } else {
      for (const file of pdfFiles) {
        const filePath = path.join(reportsDir, file);
        const stats = await fs.stat(filePath);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB, age: ${ageHours.toFixed(2)} hours)`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }

  // Run cleanup
  console.log('🧹 Running cleanup (deletes PDFs older than 24 hours)...\n');
  await cleanupOldPDFs();

  // List files after cleanup
  console.log('\n📋 Remaining PDF files after cleanup:');
  try {
    const files = await fs.readdir(reportsDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log('   No PDF files remaining\n');
    } else {
      for (const file of pdfFiles) {
        const filePath = path.join(reportsDir, file);
        const stats = await fs.stat(filePath);
        const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
        console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB, age: ${ageHours.toFixed(2)} hours)`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('Error reading directory:', error);
  }

  console.log('✨ Cleanup test complete!');
  console.log('\n💡 Note: Test PDFs in uploads/reports/test/ are not deleted by cleanup.');
}

// Run test
testCleanup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

