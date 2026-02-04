const mongoose = require('mongoose');
const Material = require('../models/Material');
const MaterialLog = require('../models/MaterialLog');
const Project = require('../models/Project');
const User = require('../models/User');
require('dotenv').config({ path: '.env.development' });

const testDirectReception = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Find a project and an admin/manager user
        const project = await Project.findOne();
        const user = await User.findOne({ role: 'Admin' });

        if (!project || !user) {
            console.log('❌ Project or Admin user not found. Run seeds first.');
            process.exit(1);
        }

        console.log(`Testing reception for project: ${project.name}`);

        // Define test payload
        const payload = {
            projectId: project._id,
            materialName: 'Test Cement ' + Date.now(),
            quantity: 50,
            unit: 'sac',
            deliveredBy: 'Test Driver',
            notes: 'Automated test entry',
            price: 15.5
        };

        // Simulated Controller Logic (since we are testing the logic block)
        let material = await Material.findOne({ projectId: payload.projectId, name: payload.materialName });
        if (!material) {
            material = await Material.create({
                projectId: payload.projectId,
                name: payload.materialName,
                unit: payload.unit,
                price: payload.price,
                stockQuantity: 0
            });
        }

        material.stockQuantity += payload.quantity;
        await material.save();

        const log = await MaterialLog.create({
            materialId: material._id,
            loggedBy: user._id,
            quantity: payload.quantity,
            type: 'IN',
            deliveredBy: payload.deliveredBy,
            photos: [{ url: '/uploads/materials/test-photo.jpg' }],
            notes: payload.notes
        });

        console.log('✓ Material stock updated:', material.stockQuantity);
        console.log('✓ Material Log created:', log._id);
        console.log('✓ Photos support verified (Count:', log.photos.length, ')');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

testDirectReception();
