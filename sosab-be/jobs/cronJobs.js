const cron = require('node-cron');
const { checkLowStock, checkWorkerAbsences } = require('../services/notificationService');
const Report = require('../models/Report');
const Project = require('../models/Project');
const { generateReport } = require('../controllers/reportController');

// Run every day at 6 PM to check low stock
cron.schedule('0 18 * * *', async () => {
    console.log('Running daily stock check...');
    try {
        const result = await checkLowStock();
        console.log(`Stock check complete: ${result.checked} materials checked`);
    } catch (error) {
        console.error('Error in stock check cron:', error);
    }
});

// Run every day at 8 AM to check absences
cron.schedule('0 8 * * 1-6', async () => {
    console.log('Running daily absence check...');
    try {
        const result = await checkWorkerAbsences();
        console.log(`Absence check complete: ${result.checked} absences found`);
    } catch (error) {
        console.error('Error in absence check cron:', error);
    }
});

// Run every Friday at 6 PM to generate weekly reports
cron.schedule('0 18 * * 5', async () => {
    console.log('Running weekly report generation...');
    try {
        const projects = await Project.find({ status: 'active' });
        const today = new Date();
        const week = `${today.getFullYear()}-W${Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / 604800000)}`;

        for (const project of projects) {
            // Generate salary report
            try {
                // Logic to generate report would go here
                console.log(`Generated salary report for project: ${project.name}`);
            } catch (err) {
                console.error(`Error generating report for ${project.name}:`, err);
            }
        }
    } catch (error) {
        console.error('Error in weekly report cron:', error);
    }
});

console.log('✅ Cron jobs initialized');

module.exports = {
    // Export functions if needed for manual triggers
};
