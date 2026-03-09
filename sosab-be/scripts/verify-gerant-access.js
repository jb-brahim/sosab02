const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const User = require('../models/User');
const Project = require('../models/Project');

dotenv.config({ path: '.env.development' });

const API_URL = `http://localhost:${process.env.PORT || 5000}/api`;

const verifyGerantAccess = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create a Gérant user if it doesn't exist
        let gerant = await User.findOne({ email: 'test.gerant@sosab.com' });
        if (!gerant) {
            gerant = await User.create({
                name: 'Test Gérant',
                email: 'test.gerant@sosab.com',
                password: 'password123',
                role: 'Gérant',
                active: true
            });
            console.log('Test Gérant created');
        }

        // 2. Login as Gérant
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'test.gerant@sosab.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Logged in as Gérant');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 3. Get projects (should see all)
        const projectsRes = await axios.get(`${API_URL}/projects`, config);
        console.log(`Gérant can see ${projectsRes.data.count} projects`);

        if (projectsRes.data.data.length === 0) {
            console.log('No projects found to test report generation');
            return;
        }

        const testProject = projectsRes.data.data[0];
        console.log(`Testing with project: ${testProject.name}`);

        // 4. Test report generation
        console.log('Attempting to generate attendance report...');
        try {
            const reportRes = await axios.post(`${API_URL}/reports/generate`, {
                projectId: testProject._id,
                type: 'attendance',
                startDate: '2024-03-01',
                endDate: '2024-03-07'
            }, config);
            console.log('✓ Report generated successfully:', reportRes.data.data.pdfUrl);
        } catch (err) {
            console.error('✗ Failed to generate report:', err.response?.data || err.message);
        }

        // 5. Test getting reports
        console.log('Attempting to fetch reports...');
        try {
            const reportsRes = await axios.get(`${API_URL}/reports`, config);
            console.log(`✓ Fetched ${reportsRes.data.count} reports`);
        } catch (err) {
            console.error('✗ Failed to fetch reports:', err.response?.data || err.message);
        }

        // 6. Test project update
        console.log('Attempting to update project...');
        try {
            const updateRes = await axios.patch(`${API_URL}/projects/${testProject._id}`, {
                description: `Updated by Gérant at ${new Date().toISOString()}`
            }, config);
            console.log('✓ Project updated successfully');
        } catch (err) {
            console.error('✗ Failed to update project:', err.response?.data || err.message);
        }

        console.log('\nVerification complete!');

    } catch (error) {
        console.error('Verification failed:', error.response?.data || error.message);
    } finally {
        await mongoose.connection.close();
    }
};

verifyGerantAccess();
