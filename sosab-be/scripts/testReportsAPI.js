const axios = require('axios');

const testReportsAPI = async () => {
    try {
        // First, login to get a token
        const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@sosab.com',
            password: 'Adminsosab'
        });

        const token = loginResponse.data.token;
        console.log('✓ Logged in successfully');

        // Now fetch reports
        const reportsResponse = await axios.get('http://localhost:3000/api/reports', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\n✓ Reports API Response:');
        console.log('Success:', reportsResponse.data.success);
        console.log('Count:', reportsResponse.data.count);
        console.log('Reports:', JSON.stringify(reportsResponse.data.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
};

testReportsAPI();
