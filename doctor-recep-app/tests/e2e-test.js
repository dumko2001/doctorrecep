#!/usr/bin/env node

/**
 * End-to-End Test Suite for Doctor Reception System
 * Tests the complete flow from signup to consultation processing
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:3001',
  testUser: {
    name: 'Dr. Test User',
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    clinic_name: 'Test Clinic',
    phone: '+91 9876543210'
  }
};

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++;
    testResults.tests.push({ name: message, status: 'PASSED' });
    log(`PASS: ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.tests.push({ name: message, status: 'FAILED' });
    log(`FAIL: ${message}`, 'error');
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    return {
      ok: response.ok,
      status: response.status,
      data: await response.text(),
      headers: response.headers
    };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    throw error;
  }
}

// Test functions
async function testBackendHealth() {
  log('Testing backend health endpoint...');
  const response = await makeRequest(`${config.backendUrl}/health`);
  
  assert(response.ok, 'Backend health endpoint responds');
  assert(response.status === 200, 'Backend returns 200 status');
  
  const data = JSON.parse(response.data);
  assert(data.status === 'healthy', 'Backend reports healthy status');
  assert(data.timestamp, 'Backend returns timestamp');
}

async function testFrontendPages() {
  log('Testing frontend page accessibility...');
  
  // Test homepage
  const homeResponse = await makeRequest(config.frontendUrl);
  assert(homeResponse.ok, 'Homepage loads successfully');
  
  // Test login page
  const loginResponse = await makeRequest(`${config.frontendUrl}/login`);
  assert(loginResponse.ok, 'Login page loads successfully');
  
  // Test signup page
  const signupResponse = await makeRequest(`${config.frontendUrl}/signup`);
  assert(signupResponse.ok, 'Signup page loads successfully');
  
  // Test protected page (should redirect)
  const recordResponse = await makeRequest(`${config.frontendUrl}/record`);
  assert(recordResponse.status === 200, 'Record page handles unauthenticated access');
}

async function testPWAManifest() {
  log('Testing PWA manifest...');
  
  const manifestResponse = await makeRequest(`${config.frontendUrl}/manifest.json`);
  assert(manifestResponse.ok, 'PWA manifest is accessible');
  
  const manifest = JSON.parse(manifestResponse.data);
  assert(manifest.name === 'Doctor Reception System', 'Manifest has correct app name');
  assert(manifest.short_name === 'DoctorRecep', 'Manifest has correct short name');
  assert(manifest.display === 'standalone', 'Manifest configured for standalone display');
  assert(Array.isArray(manifest.icons), 'Manifest includes icons array');
  assert(manifest.icons.length > 0, 'Manifest has at least one icon');
}

async function testDatabaseConnection() {
  log('Testing database connection via signup attempt...');
  
  // This will help us identify RLS issues
  const signupData = new URLSearchParams({
    name: config.testUser.name,
    email: config.testUser.email,
    password: config.testUser.password,
    clinic_name: config.testUser.clinic_name,
    phone: config.testUser.phone
  });
  
  const response = await makeRequest(`${config.frontendUrl}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: signupData.toString()
  });
  
  // For now, we just check that the request doesn't crash the server
  assert(response.status !== 500, 'Signup request does not crash server');
  log(`Signup response status: ${response.status}`);
}

async function testBackendCORS() {
  log('Testing backend CORS configuration...');
  
  const response = await makeRequest(`${config.backendUrl}/health`, {
    headers: {
      'Origin': config.frontendUrl
    }
  });
  
  assert(response.ok, 'Backend accepts requests from frontend origin');
}

// Main test runner
async function runTests() {
  log('🚀 Starting End-to-End Test Suite for Doctor Reception System');
  log('='.repeat(60));
  
  const tests = [
    testBackendHealth,
    testFrontendPages,
    testPWAManifest,
    testBackendCORS,
    testDatabaseConnection
  ];
  
  for (const test of tests) {
    try {
      await test();
      log(`✅ ${test.name} completed successfully`);
    } catch (error) {
      log(`❌ ${test.name} failed: ${error.message}`, 'error');
    }
    log('-'.repeat(40));
  }
  
  // Print summary
  log('='.repeat(60));
  log(`📊 Test Summary:`);
  log(`   Passed: ${testResults.passed}`);
  log(`   Failed: ${testResults.failed}`);
  log(`   Total:  ${testResults.passed + testResults.failed}`);
  
  if (testResults.failed === 0) {
    log('🎉 All tests passed!', 'success');
  } else {
    log(`⚠️  ${testResults.failed} test(s) failed`, 'error');
  }
  
  // Save detailed results
  const resultsPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.passed + testResults.failed
    },
    tests: testResults.tests,
    config
  }, null, 2));
  
  log(`📄 Detailed results saved to: ${resultsPath}`);
  
  return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runTests, config };
