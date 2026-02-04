const axios = require('axios');

const testLogin = async () => {
    try {
        console.log('Testing login with credentials:');
        console.log('Email: admin@sosab.com');
        console.log('Password: Adminsosab');
        console.log('\nSending request to: http://localhost:3000/api/auth/login\n');

        const response = await axios.post('http://localhost:3000/api/auth/login', {
            email: 'admin@sosab.com',
            password: 'Adminsosab'
        });

        console.log('✓ Login successful!');
        console.log('\nResponse:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Login failed!');
        if (error.response) {
            console.error('\nStatus:', error.response.status);
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('\nNo response received from server');
            console.error('Error:', error.message);
        } else {
            console.error('\nError:', error.message);
        }
    }
};

testLogin();
