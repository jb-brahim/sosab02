/**
 * Migration script: managerId -> managers (array)
 *
 * This script copies each project's existing `managerId` value into the new
 * `managers` array, so existing projects retain their manager assignments.
 *
 * Run ONCE after deploying the updated code:
 *   node scripts/migrate-managers.js
 */

require('dotenv').config({ path: '.env.development' });
const mongoose = require('mongoose');

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Access the raw collection to handle the old schema
    const collection = mongoose.connection.collection('projects');

    // Find all projects that still have a managerId but no managers array (or empty)
    const projects = await collection.find({
        managerId: { $exists: true, $ne: null }
    }).toArray();

    console.log(`Found ${projects.length} project(s) to migrate`);

    let count = 0;
    for (const project of projects) {
        const managersAlreadySet = project.managers && project.managers.length > 0;
        if (!managersAlreadySet) {
            await collection.updateOne(
                { _id: project._id },
                { $set: { managers: [project.managerId] } }
            );
            count++;
            console.log(`  Migrated project: ${project.name} (${project._id})`);
        } else {
            console.log(`  Skipped (managers already set): ${project.name}`);
        }
    }

    console.log(`\nDone! Migrated ${count} project(s).`);
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
