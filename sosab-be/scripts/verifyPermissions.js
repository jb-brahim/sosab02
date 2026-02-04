const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { addWorker } = require('../controllers/workerController');
const { generateReport, getReport } = require('../controllers/reportController');
const { addMaterialLog } = require('../controllers/materialLogController');
const { addMaterial } = require('../controllers/materialController');
const User = require('../models/User');
const Project = require('../models/Project');
const Material = require('../models/Material');

// Mock specific logic
const mockResponse = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const runTests = async () => {
    // Load Env
    dotenv.config({ path: '.env' });
    if (!process.env.MONGODB_URI) {
        console.error('No MONGODB_URI found.');
        // fallback for test
        process.env.MONGODB_URI = 'mongodb://localhost:27017/sosab-test';
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB for testing.');

        // Cleanup
        await User.deleteMany({ email: /test-perm-/ });
        await Project.deleteMany({ name: /Test Perm/ });
        await Material.deleteMany({ name: /Test Mat/ });

        // Setup Data
        const admin = await User.create({ name: 'Test Admin', email: 'test-perm-admin@sosab.com', password: 'password123', role: 'Admin' });
        const pm1 = await User.create({ name: 'Test PM1', email: 'test-perm-pm1@sosab.com', password: 'password123', role: 'Project Manager' });
        const pm2 = await User.create({ name: 'Test PM2', email: 'test-perm-pm2@sosab.com', password: 'password123', role: 'Project Manager' });

        const p1 = await Project.create({
            name: 'Test Perm P1',
            managerId: pm1._id,
            location: 'Loc1',
            budget: 1000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000)
        });
        const p2 = await Project.create({
            name: 'Test Perm P2',
            managerId: pm2._id,
            location: 'Loc2',
            budget: 1000,
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000)
        });

        const mat1 = await Material.create({ name: 'Test Mat P1', projectId: p1._id, unit: 'kg', price: 10, supplierId: new mongoose.Types.ObjectId() });

        console.log('\n--- TEST CASE 1: Admin Creating Worker (Should FAIL) ---');
        const req1 = {
            user: admin,
            body: { name: 'Worker A', projectId: p1._id, dailySalary: 100 }
        };
        const res1 = mockResponse();
        try {
            await addWorker(req1, res1);
            console.log('Result:', res1.statusCode, res1.body.message);
            if (res1.statusCode === 403) console.log('PASS: Admin blocked from creating worker.');
            else console.log('FAIL: Admin NOT blocked.');
        } catch (e) { console.error('Error:', e.message); }

        console.log('\n--- TEST CASE 2: PM1 Creating Worker for Own Project (Should SUCCESS) ---');
        const req2 = {
            user: pm1,
            body: { name: 'Worker B', projectId: p1._id, dailySalary: 100 }
        };
        const res2 = mockResponse();
        try {
            await addWorker(req2, res2);
            console.log('Result:', res2.statusCode);
            if (res2.statusCode === 201) console.log('PASS: PM1 created worker for P1.');
            else console.log('FAIL: PM1 failed to create worker.');
        } catch (e) { console.error('Error:', e.message); }

        console.log('\n--- TEST CASE 3: PM1 Creating Worker for Other Project (Should FAIL) ---');
        const req3 = {
            user: pm1,
            body: { name: 'Worker C', projectId: p2._id, dailySalary: 100 }
        };
        const res3 = mockResponse();
        try {
            await addWorker(req3, res3);
            console.log('Result:', res3.statusCode, res3.body.message);
            if (res3.statusCode === 403) console.log('PASS: PM1 blocked from creating worker for P2.');
            else console.log('FAIL');
        } catch (e) { console.error('Error:', e.message); }

        console.log('\n--- TEST CASE 4: PM1 Generating Report for Other Project (Should FAIL) ---');
        const req4 = {
            user: pm1,
            body: { projectId: p2._id, type: 'activity', week: '2025-W01' },
            headers: {} // mock headers if needed
        };
        const res4 = mockResponse();
        try {
            await generateReport(req4, res4);
            console.log('Result:', res4.statusCode, res4.body?.message);
            if (res4.statusCode === 403) console.log('PASS: PM1 blocked from generating report for P2.');
            else console.log('FAIL');
        } catch (e) { console.error('Error:', e.message); }

        console.log('\n--- TEST CASE 5: PM1 Logging Material for Own Project (Should SUCCESS) ---');
        const req5 = {
            user: pm1,
            body: { materialId: mat1._id, type: 'IN', quantity: 10, supplier: 'Sup1' }
        };
        const res5 = mockResponse();
        try {
            await addMaterialLog(req5, res5);
            console.log('Result:', res5.statusCode);
            if (res5.statusCode === 201) console.log('PASS: PM1 logged material for P1.');
            else console.log('FAIL');
        } catch (e) { console.error('Error:', e.message); }

        console.log('\n--- TEST CASE 6: PM2 Logging Material for P1 (Should FAIL) ---');
        const req6 = {
            user: pm2,
            body: { materialId: mat1._id, type: 'IN', quantity: 10 }
        };
        const res6 = mockResponse();
        try {
            await addMaterialLog(req6, res6);
            console.log('Result:', res6.statusCode, res6.body.message);
            if (res6.statusCode === 403) console.log('PASS: PM2 blocked from logging material for P1.');
            else console.log('FAIL');
        } catch (e) { console.error('Error:', e.message); }

    } catch (err) {
        console.error('Test Setup Failed:', err);
    } finally {
        // cleanup
        await User.deleteMany({ email: /test-perm-/ });
        await Project.deleteMany({ name: /Test Perm/ });
        await Material.deleteMany({ name: /Test Mat/ });
        await mongoose.disconnect();
    }
};

runTests();
