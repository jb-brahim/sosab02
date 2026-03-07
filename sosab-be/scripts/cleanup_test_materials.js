const mongoose = require('mongoose');
const path = require('path');
const connectDB = require('../config/db');
const Material = require('../models/Material');
const MaterialLog = require('../models/MaterialLog');

// Test materials to remove based on the screenshot
const testMaterialNames = [
    'Solar Panels 450W',
    'Red Bricks 12 holes',

];

async function cleanup() {
    try {
        // 1. Connect to DB
        await connectDB();
        console.log('Connected to database for cleanup...');

        // 2. Find materials
        const materialsToDelete = await Material.find({
            name: { $in: testMaterialNames }
        });

        console.log(`Found ${materialsToDelete.length} materials matching the test list.`);

        if (materialsToDelete.length === 0) {
            console.log('No test materials found. Exit.');
            process.exit(0);
        }

        const materialIds = materialsToDelete.map(m => m._id);

        // 3. Delete associated logs
        const logDeleteResult = await MaterialLog.deleteMany({
            materialId: { $in: materialIds }
        });
        console.log(`Deleted ${logDeleteResult.deletedCount} associated material logs.`);

        // 4. Delete the materials
        const materialDeleteResult = await Material.deleteMany({
            _id: { $in: materialIds }
        });
        console.log(`Deleted ${materialDeleteResult.deletedCount} test materials.`);

        console.log('Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanup();
