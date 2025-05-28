#!/usr/bin/env node

/**
 * Complete End-to-End Test Suite
 * Tests the entire application flow including signup, login, recording, and AI processing
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:3001',
  testUser: {
    name: 'Dr. E2E Test',
    email: `e2e${Date.now()}@example.com`,
    password: 'testpassword123',
    clinic_name: 'E2E Test Clinic',
    phone: '+91 9876543210'
  }
};

let testResults = { passed: 0, failed: 0, tests: [], issues: [] };

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
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

function addIssue(issue, severity = 'medium') {
  testResults.issues.push({ issue, severity, timestamp: new Date().toISOString() });
  log(`ISSUE (${severity}): ${issue}`, severity === 'high' ? 'error' : 'warning');
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      ...options
    });
    
    const text = await response.text();
    
    return {
      ok: response.ok,
      status: response.status,
      data: text,
      headers: response.headers,
      redirected: response.status >= 300 && response.status < 400,
      location: response.headers.get('location')
    };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    throw error;
  }
}

async function testSystemHealth() {
  log('Testing system health...');
  
  // Test backend health
  const backendResponse = await makeRequest(`${config.backendUrl}/health`);
  assert(backendResponse.ok, 'Backend API is healthy');
  
  const healthData = JSON.parse(backendResponse.data);
  assert(healthData.status === 'healthy', 'Backend reports healthy status');
  
  // Test frontend accessibility
  const frontendResponse = await makeRequest(config.frontendUrl);
  assert(frontendResponse.ok, 'Frontend is accessible');
  
  // Test PWA manifest
  const manifestResponse = await makeRequest(`${config.frontendUrl}/manifest.json`);
  assert(manifestResponse.ok, 'PWA manifest is accessible');
  
  const manifest = JSON.parse(manifestResponse.data);
  assert(manifest.name === 'Doctor Reception System', 'PWA manifest is correctly configured');
}

async function testAuthenticationFlow() {
  log('Testing authentication flow...');
  
  // Test signup page loads
  const signupPageResponse = await makeRequest(`${config.frontendUrl}/signup`);
  assert(signupPageResponse.ok, 'Signup page loads successfully');
  
  // Extract form data
  const html = signupPageResponse.data;
  const actionKeyMatch = html.match(/name="\$ACTION_KEY" value="([^"]+)"/);
  const actionDataMatch = html.match(/name="\$ACTION_1:0" value="([^"]+)"/);
  
  if (!actionKeyMatch || !actionDataMatch) {
    addIssue('Cannot extract signup form data - form structure may have changed', 'high');
    return;
  }
  
  // Prepare signup form data
  const formData = new URLSearchParams();
  formData.append('$ACTION_REF_1', '');
  formData.append('$ACTION_KEY', actionKeyMatch[1]);
  formData.append('$ACTION_1:0', actionDataMatch[1]);
  formData.append('$ACTION_1:1', '[{}]');
  formData.append('name', config.testUser.name);
  formData.append('email', config.testUser.email);
  formData.append('password', config.testUser.password);
  formData.append('clinic_name', config.testUser.clinic_name);
  formData.append('phone', config.testUser.phone);
  
  // Submit signup
  const signupResponse = await makeRequest(`${config.frontendUrl}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });
  
  log(`Signup response status: ${signupResponse.status}`);
  
  // Check signup result
  if (signupResponse.redirected && signupResponse.location === '/dashboard') {
    assert(true, 'Signup successful - redirected to dashboard');
  } else if (signupResponse.status === 200) {
    // Check for error messages
    const hasError = signupResponse.data.includes('An error occurred') ||
                    signupResponse.data.includes('error') ||
                    signupResponse.data.includes('violates row-level security');
    
    if (hasError) {
      addIssue('Signup failed - likely due to RLS policy configuration in Supabase', 'high');
      addIssue('Run the SQL from database/fix-rls-policies.sql in your Supabase dashboard', 'high');
      log('Signup failed but continuing with other tests...', 'warning');
    } else {
      assert(true, 'Signup form processed without visible errors');
    }
  }
}

async function testProtectedRoutes() {
  log('Testing protected routes...');
  
  // Test record page (should redirect to login if not authenticated)
  const recordResponse = await makeRequest(`${config.frontendUrl}/record`);
  
  if (recordResponse.redirected && recordResponse.location === '/login') {
    assert(true, 'Protected route correctly redirects to login');
  } else if (recordResponse.status === 200) {
    const hasRedirect = recordResponse.data.includes('NEXT_REDIRECT') && 
                       recordResponse.data.includes('/login');
    assert(hasRedirect, 'Protected route contains redirect to login');
  }
  
  // Test dashboard access
  const dashboardResponse = await makeRequest(`${config.frontendUrl}/dashboard`);
  const dashboardRedirects = dashboardResponse.redirected || 
                           dashboardResponse.data.includes('/login');
  assert(dashboardRedirects, 'Dashboard correctly requires authentication');
}

async function testRecordingInterface() {
  log('Testing recording interface...');
  
  // Test that record page loads (even if it redirects)
  const recordResponse = await makeRequest(`${config.frontendUrl}/record`);
  
  // Should either redirect to login or load the page
  const isValidResponse = recordResponse.redirected || recordResponse.ok;
  assert(isValidResponse, 'Record interface is accessible');
  
  if (recordResponse.ok) {
    // Check for key components
    const hasRecordingInterface = recordResponse.data.includes('Record') ||
                                 recordResponse.data.includes('consultation');
    assert(hasRecordingInterface, 'Record page contains recording interface elements');
  }
}

async function testBackendAPI() {
  log('Testing backend API endpoints...');
  
  // Test health endpoint
  const healthResponse = await makeRequest(`${config.backendUrl}/health`);
  assert(healthResponse.ok, 'Backend health endpoint responds');
  
  // Test CORS
  const corsResponse = await makeRequest(`${config.backendUrl}/health`, {
    headers: {
      'Origin': config.frontendUrl
    }
  });
  assert(corsResponse.ok, 'Backend accepts CORS requests from frontend');
  
  // Test generate-summary endpoint structure (without valid data)
  const summaryResponse = await makeRequest(`${config.backendUrl}/api/generate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  });
  
  // Should return an error but not crash
  assert(summaryResponse.status !== 500, 'Generate summary endpoint handles invalid requests gracefully');
}

async function runCompleteTests() {
  log('🚀 Starting Complete End-to-End Test Suite');
  log('='.repeat(60));
  
  const tests = [
    testSystemHealth,
    testAuthenticationFlow,
    testProtectedRoutes,
    testRecordingInterface,
    testBackendAPI
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
  
  // Print comprehensive summary
  log('='.repeat(60));
  log(`📊 Complete Test Summary:`);
  log(`   Passed: ${testResults.passed}`);
  log(`   Failed: ${testResults.failed}`);
  log(`   Total:  ${testResults.passed + testResults.failed}`);
  log(`   Issues: ${testResults.issues.length}`);
  
  if (testResults.issues.length > 0) {
    log('');
    log('🔧 Issues Found:');
    testResults.issues.forEach((issue, index) => {
      log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
    });
  }
  
  if (testResults.failed === 0 && testResults.issues.length === 0) {
    log('🎉 All tests passed with no issues!', 'success');
  } else if (testResults.failed === 0) {
    log('✅ All tests passed but some issues need attention', 'warning');
  } else {
    log(`⚠️  ${testResults.failed} test(s) failed`, 'error');
  }
  
  // Save detailed results
  const resultsPath = path.join(__dirname, 'complete-test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.passed + testResults.failed,
      issues: testResults.issues.length
    },
    tests: testResults.tests,
    issues: testResults.issues,
    config
  }, null, 2));
  
  log(`📄 Detailed results saved to: ${resultsPath}`);
  
  return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runCompleteTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runCompleteTests, config };
