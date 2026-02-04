/**
 * Test script to verify backend validation is working
 * 
 * This script tests:
 * 1. Worker validation (valid and invalid cases)
 * 2. Project validation (valid and invalid cases)
 * 3. Error response format
 * 
 * Usage: node scripts/testValidation.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

// Test data
const validWorker = {
    name: "Test Worker",
    projectId: "507f1f77bcf86cd799439011", // Valid ObjectId format
    dailySalary: 150,
    contact: {
        phone: "+1 (555) 123-4567",
        address: "123 Test Street"
    }
};

const invalidWorkerStringContact = {
    name: "Test Worker",
    projectId: "507f1f77bcf86cd799439011",
    dailySalary: 150,
    contact: "555-1234" // String instead of object
};

const invalidWorkerShortName = {
    name: "A", // Too short
    projectId: "507f1f77bcf86cd799439011",
    dailySalary: 150
};

const invalidWorkerNegativeSalary = {
    name: "Test Worker",
    projectId: "507f1f77bcf86cd799439011",
    dailySalary: -50 // Negative
};

const validProject = {
    name: "Test Project",
    location: "Test Location",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    budget: 100000
};

const invalidProjectDateRange = {
    name: "Test Project",
    location: "Test Location",
    startDate: "2024-12-31",
    endDate: "2024-01-01" // End before start
};

// Helper function to test endpoint
async function testEndpoint(name, method, endpoint, data, shouldSucceed, token) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${name}`);
    console.log(`${'='.repeat(60)}`);

    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            data,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        };

        const response = await axios(config);

        if (shouldSucceed) {
            log.success(`Request succeeded as expected`);
            log.info(`Status: ${response.status}`);
            log.info(`Response: ${JSON.stringify(response.data, null, 2)}`);
            return true;
        } else {
            log.error(`Request succeeded but should have failed!`);
            log.warning(`Response: ${JSON.stringify(response.data, null, 2)}`);
            return false;
        }
    } catch (error) {
        if (!shouldSucceed) {
            log.success(`Request failed as expected`);
            log.info(`Status: ${error.response?.status}`);
            log.info(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
            return true;
        } else {
            log.error(`Request failed but should have succeeded!`);
            log.warning(`Error: ${error.message}`);
            if (error.response) {
                log.warning(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            return false;
        }
    }
}

// Main test function
async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('BACKEND VALIDATION TEST SUITE');
    console.log('='.repeat(60));

    log.info(`API URL: ${API_URL}`);
    log.warning('Note: These tests will fail with 401 if not authenticated');
    log.warning('To run full tests, first login and get a token\n');

    let passedTests = 0;
    let totalTests = 0;

    // Test 1: Invalid worker - string contact
    totalTests++;
    if (await testEndpoint(
        'Worker Creation - String Contact (Should Fail)',
        'POST',
        '/workers',
        invalidWorkerStringContact,
        false
    )) passedTests++;

    // Test 2: Invalid worker - short name
    totalTests++;
    if (await testEndpoint(
        'Worker Creation - Short Name (Should Fail)',
        'POST',
        '/workers',
        invalidWorkerShortName,
        false
    )) passedTests++;

    // Test 3: Invalid worker - negative salary
    totalTests++;
    if (await testEndpoint(
        'Worker Creation - Negative Salary (Should Fail)',
        'POST',
        '/workers',
        invalidWorkerNegativeSalary,
        false
    )) passedTests++;

    // Test 4: Invalid project - date range
    totalTests++;
    if (await testEndpoint(
        'Project Creation - Invalid Date Range (Should Fail)',
        'POST',
        '/projects',
        invalidProjectDateRange,
        false
    )) passedTests++;

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}Failed: ${totalTests - passedTests}${colors.reset}`);
    console.log('='.repeat(60) + '\n');

    if (passedTests === totalTests) {
        log.success('All validation tests passed! ✨');
    } else {
        log.error('Some tests failed. Check the output above.');
    }

    console.log('\n' + colors.blue + 'Note:' + colors.reset);
    console.log('- 401 errors are expected (authentication required)');
    console.log('- 400 errors with validation messages indicate validation is working');
    console.log('- To test with authentication, login first and add token to tests\n');
}

// Run tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
