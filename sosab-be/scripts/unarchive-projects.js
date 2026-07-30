const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log('✓ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Unarchive all existing projects
    const result = await db.collection('projects').updateMany(
        {},
        { $set: { isArchived: false } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} projects to isArchived: false`);
    
    const projects = await db.collection('projects').find({}).toArray();
    console.log(`Total projects in DB now active: ${projects.length}`);
    projects.forEach(p => console.log(`  - [${p._id}] ${p.name} (isArchived: ${p.isArchived})`));
    
    await mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
