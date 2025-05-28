#!/usr/bin/env node

/**
 * Session Management Test
 * Tests login, session persistence, and protected route access
 */

const fs = require('fs');
const path = require('path');

const config = {
  frontendUrl: 'http://localhost:3000',
  testUser: {
    email: 'dumko.raj@gmail.com',
    password: 'Admin123$'
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
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
      location: response.headers.get('location'),
      cookies: response.headers.get('set-cookie')
    };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    throw error;
  }
}

async function testSessionPersistence() {
  log('🔐 Testing Session Management and Persistence');
  log('='.repeat(50));
  
  // Step 1: Get login page
  log('1. Getting login page...');
  const loginPageResponse = await makeRequest(`${config.frontendUrl}/login`);
  
  if (!loginPageResponse.ok) {
    log('❌ Login page not accessible', 'error');
    return false;
  }
  
  log('✅ Login page accessible');
  
  // Step 2: Extract form data
  const html = loginPageResponse.data;
  const actionKeyMatch = html.match(/name="\$ACTION_KEY" value="([^"]+)"/);
  const actionDataMatch = html.match(/name="\$ACTION_1:0" value="([^"]+)"/);
  
  if (!actionKeyMatch || !actionDataMatch) {
    log('❌ Cannot extract login form data', 'error');
    return false;
  }
  
  log('✅ Login form data extracted');
  
  // Step 3: Submit login
  log('2. Submitting login...');
  const formData = new URLSearchParams();
  formData.append('$ACTION_REF_1', '');
  formData.append('$ACTION_KEY', actionKeyMatch[1]);
  formData.append('$ACTION_1:0', actionDataMatch[1]);
  formData.append('$ACTION_1:1', '[{}]');
  formData.append('email', config.testUser.email);
  formData.append('password', config.testUser.password);
  
  const loginResponse = await makeRequest(`${config.frontendUrl}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });
  
  log(`Login response status: ${loginResponse.status}`);
  
  // Check for session cookie
  const sessionCookie = loginResponse.cookies;
  if (sessionCookie && sessionCookie.includes('session=')) {
    log('✅ Session cookie set successfully');
  } else {
    log('⚠️  No session cookie found in response');
  }
  
  // Check if redirected to dashboard
  if (loginResponse.redirected && loginResponse.location === '/dashboard') {
    log('✅ Login successful - redirected to dashboard');
  } else if (loginResponse.status === 200) {
    const hasError = loginResponse.data.includes('Invalid email or password') ||
                    loginResponse.data.includes('error');
    
    if (hasError) {
      log('❌ Login failed - invalid credentials or other error', 'error');
      return false;
    } else {
      log('✅ Login processed successfully');
    }
  }
  
  // Step 4: Test protected route access with session
  log('3. Testing protected route access...');
  
  // Extract session cookie value if available
  let cookieHeader = '';
  if (sessionCookie) {
    const sessionMatch = sessionCookie.match(/session=([^;]+)/);
    if (sessionMatch) {
      cookieHeader = `session=${sessionMatch[1]}`;
      log('✅ Using session cookie for protected route test');
    }
  }
  
  // Test record page access
  const recordResponse = await makeRequest(`${config.frontendUrl}/record`, {
    headers: {
      'Cookie': cookieHeader
    }
  });
  
  log(`Record page response status: ${recordResponse.status}`);
  
  if (recordResponse.ok) {
    // Check if it contains the recording interface
    const hasRecordingInterface = recordResponse.data.includes('Record') &&
                                 recordResponse.data.includes('consultation');
    
    if (hasRecordingInterface) {
      log('✅ Protected route accessible with session - recording interface loaded');
    } else {
      log('⚠️  Protected route accessible but content may be incomplete');
    }
  } else if (recordResponse.redirected && recordResponse.location === '/login') {
    log('❌ Session not persisting - still redirecting to login', 'error');
    return false;
  } else {
    log(`⚠️  Unexpected response from protected route: ${recordResponse.status}`);
  }
  
  // Step 5: Test dashboard access
  log('4. Testing dashboard access...');
  
  const dashboardResponse = await makeRequest(`${config.frontendUrl}/dashboard`, {
    headers: {
      'Cookie': cookieHeader
    }
  });
  
  log(`Dashboard response status: ${dashboardResponse.status}`);
  
  if (dashboardResponse.ok) {
    const hasDashboard = dashboardResponse.data.includes('Dashboard') &&
                        dashboardResponse.data.includes('Welcome back');
    
    if (hasDashboard) {
      log('✅ Dashboard accessible with session');
    } else {
      log('⚠️  Dashboard accessible but content may be incomplete');
    }
  } else if (dashboardResponse.redirected && dashboardResponse.location === '/login') {
    log('❌ Dashboard not accessible - redirecting to login', 'error');
    return false;
  }
  
  log('='.repeat(50));
  log('📊 Session Test Summary:');
  log('   ✅ Login page accessible');
  log('   ✅ Login form processing');
  log(`   ${sessionCookie ? '✅' : '⚠️ '} Session cookie handling`);
  log(`   ${recordResponse.ok ? '✅' : '❌'} Protected route access`);
  log(`   ${dashboardResponse.ok ? '✅' : '❌'} Dashboard access`);
  
  const allWorking = loginResponse.status !== 500 && 
                    recordResponse.ok && 
                    dashboardResponse.ok;
  
  if (allWorking) {
    log('');
    log('🎉 Session management is working correctly!', 'success');
    log('   You should now be able to:');
    log('   1. Login and stay logged in');
    log('   2. Access protected routes');
    log('   3. Use the recording interface');
    log('   4. Access the dashboard');
  } else {
    log('');
    log('⚠️  Session management needs attention', 'error');
    log('   Please check the server logs for more details');
  }
  
  return allWorking;
}

// Run test
if (require.main === module) {
  testSessionPersistence()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { testSessionPersistence };
