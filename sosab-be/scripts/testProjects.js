const axios = require('axios');

const testProjects = async () => {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@sosab.com',
            password: 'Adminsosab'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');
        console.log('Fetching projects...');

        const projectsRes = await axios.get('http://localhost:3000/api/projects', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Projects fetched successfully!');
        console.log('Count:', projectsRes.data.count);
    } catch (error) {
        console.error('❌ Request failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
};

testProjects();
