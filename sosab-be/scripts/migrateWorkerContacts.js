/**
 * Migration script to convert worker contact field from string to object format
 * 
 * This script:
 * 1. Finds all workers with contact as a string
 * 2. Converts string contacts to object format { phone: string, address: '' }
 * 3. Logs all changes for verification
 * 
 * Usage: node scripts/migrateWorkerContacts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Worker = require('../models/Worker');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sosab', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
};

// Migration function
const migrateContacts = async () => {
    try {
        console.log('\n🔄 Starting worker contact migration...\n');

        // Find all workers
        const workers = await Worker.find({}).lean();
        console.log(`📊 Found ${workers.length} total workers`);

        let migratedCount = 0;
        let alreadyObjectCount = 0;
        let nullContactCount = 0;
        const migrations = [];

        for (const worker of workers) {
            const workerId = worker._id;
            const workerName = worker.name;
            const contact = worker.contact;

            // Case 1: Contact is null or undefined
            if (!contact) {
                nullContactCount++;
                await Worker.findByIdAndUpdate(workerId, {
                    contact: { phone: '', address: '' }
                });
                migrations.push({
                    id: workerId,
                    name: workerName,
                    before: null,
                    after: { phone: '', address: '' },
                    action: 'Set empty object'
                });
                continue;
            }

            // Case 2: Contact is a string (needs migration)
            if (typeof contact === 'string') {
                const newContact = {
                    phone: contact,
                    address: ''
                };

                await Worker.findByIdAndUpdate(workerId, {
                    contact: newContact
                });

                migratedCount++;
                migrations.push({
                    id: workerId,
                    name: workerName,
                    before: contact,
                    after: newContact,
                    action: 'Converted string to object'
                });

                console.log(`✓ Migrated: ${workerName}`);
                console.log(`  Before: "${contact}"`);
                console.log(`  After: { phone: "${newContact.phone}", address: "${newContact.address}" }\n`);
                continue;
            }

            // Case 3: Contact is already an object
            if (typeof contact === 'object') {
                alreadyObjectCount++;

                // Ensure it has the correct structure
                const hasPhone = contact.hasOwnProperty('phone');
                const hasAddress = contact.hasOwnProperty('address');

                if (!hasPhone || !hasAddress) {
                    const updatedContact = {
                        phone: contact.phone || '',
                        address: contact.address || ''
                    };

                    await Worker.findByIdAndUpdate(workerId, {
                        contact: updatedContact
                    });

                    migrations.push({
                        id: workerId,
                        name: workerName,
                        before: contact,
                        after: updatedContact,
                        action: 'Fixed object structure'
                    });

                    console.log(`⚠ Fixed structure: ${workerName}`);
                }
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total workers processed: ${workers.length}`);
        console.log(`✅ Migrated from string: ${migratedCount}`);
        console.log(`✅ Set empty object (null): ${nullContactCount}`);
        console.log(`ℹ️  Already object format: ${alreadyObjectCount}`);
        console.log('='.repeat(60) + '\n');

        // Save migration log
        if (migrations.length > 0) {
            const fs = require('fs');
            const logPath = './migration-log-' + Date.now() + '.json';
            fs.writeFileSync(logPath, JSON.stringify(migrations, null, 2));
            console.log(`📝 Migration log saved to: ${logPath}\n`);
        }

        return {
            total: workers.length,
            migrated: migratedCount,
            nullSet: nullContactCount,
            alreadyObject: alreadyObjectCount,
            migrations
        };

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    }
};

// Main execution
const main = async () => {
    try {
        await connectDB();
        const result = await migrateContacts();

        console.log('✅ Migration completed successfully!\n');

        // Verify migration
        console.log('🔍 Verifying migration...');
        const workers = await Worker.find({});
        const stringContacts = workers.filter(w => typeof w.contact === 'string');

        if (stringContacts.length === 0) {
            console.log('✅ Verification passed: No string contacts found\n');
        } else {
            console.log(`⚠️  Warning: ${stringContacts.length} workers still have string contacts\n`);
            stringContacts.forEach(w => {
                console.log(`  - ${w.name} (${w._id}): "${w.contact}"`);
            });
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
};

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { migrateContacts };
