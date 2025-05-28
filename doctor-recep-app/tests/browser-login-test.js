#!/usr/bin/env node

/**
 * Browser Login Test
 * Simulates exact browser behavior for login and session management
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

async function testBrowserLogin() {
  log('🌐 Testing Browser-like Login Flow');
  log('='.repeat(40));
  
  // Step 1: Get login page
  log('1. Getting login page...');
  const loginPageResponse = await makeRequest(`${config.frontendUrl}/login`);
  
  if (!loginPageResponse.ok) {
    log('❌ Login page not accessible', 'error');
    return false;
  }
  
  log('✅ Login page loaded');
  
  // Step 2: Extract form data
  const html = loginPageResponse.data;
  const actionKeyMatch = html.match(/name="\$ACTION_KEY" value="([^"]+)"/);
  const actionDataMatch = html.match(/name="\$ACTION_1:0" value="([^"]+)"/);
  
  if (!actionKeyMatch || !actionDataMatch) {
    log('❌ Cannot extract form data', 'error');
    return false;
  }
  
  log('✅ Form data extracted');
  log(`   Action Key: ${actionKeyMatch[1]}`);
  log(`   Action Data: ${actionDataMatch[1].substring(0, 50)}...`);
  
  // Step 3: Submit login with proper Next.js form format
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
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    body: formData.toString()
  });
  
  log(`Login response status: ${loginResponse.status}`);
  log(`Login response headers:`, loginResponse.headers);
  
  // Check for session cookie
  const setCookieHeader = loginResponse.cookies;
  log(`Set-Cookie header: ${setCookieHeader || 'none'}`);
  
  let sessionCookie = '';
  if (setCookieHeader) {
    const sessionMatch = setCookieHeader.match(/session=([^;]+)/);
    if (sessionMatch) {
      sessionCookie = `session=${sessionMatch[1]}`;
      log('✅ Session cookie found');
      log(`   Cookie: ${sessionCookie.substring(0, 50)}...`);
    } else {
      log('⚠️  Set-Cookie header present but no session cookie found');
    }
  } else {
    log('❌ No Set-Cookie header in response', 'error');
  }
  
  // Check redirect
  if (loginResponse.redirected) {
    log(`✅ Login redirected to: ${loginResponse.location}`);
  } else if (loginResponse.status === 200) {
    // Check for errors in response
    const hasError = loginResponse.data.includes('Invalid email or password') ||
                    loginResponse.data.includes('error');
    
    if (hasError) {
      log('❌ Login failed - error in response', 'error');
      return false;
    } else {
      log('⚠️  Login returned 200 instead of redirect');
    }
  }
  
  // Step 4: Follow redirect manually (simulating browser)
  if (loginResponse.redirected && loginResponse.location) {
    log('3. Following redirect...');
    
    const redirectUrl = loginResponse.location.startsWith('http') 
      ? loginResponse.location 
      : `${config.frontendUrl}${loginResponse.location}`;
    
    const redirectResponse = await makeRequest(redirectUrl, {
      headers: {
        'Cookie': sessionCookie,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    log(`Redirect response status: ${redirectResponse.status}`);
    
    if (redirectResponse.ok) {
      const hasDashboard = redirectResponse.data.includes('Dashboard') &&
                          redirectResponse.data.includes('Welcome back');
      
      if (hasDashboard) {
        log('✅ Dashboard loaded successfully with session');
        return true;
      } else {
        log('⚠️  Redirect successful but dashboard content not found');
        log('   Response might be login page again');
        
        // Check if redirected back to login
        const isLoginPage = redirectResponse.data.includes('Sign in to your account');
        if (isLoginPage) {
          log('❌ Redirected back to login - session not working', 'error');
          return false;
        }
      }
    } else {
      log(`❌ Redirect failed with status: ${redirectResponse.status}`, 'error');
      return false;
    }
  }
  
  log('='.repeat(40));
  log('📊 Browser Login Test Summary:');
  log(`   Login Response: ${loginResponse.status}`);
  log(`   Session Cookie: ${sessionCookie ? 'Present' : 'Missing'}`);
  log(`   Redirect: ${loginResponse.redirected ? 'Yes' : 'No'}`);
  
  return sessionCookie && loginResponse.redirected;
}

// Run test
if (require.main === module) {
  testBrowserLogin()
    .then(success => {
      if (success) {
        log('');
        log('🎉 Browser login test successful!', 'success');
        log('   Session management is working correctly');
      } else {
        log('');
        log('⚠️  Browser login test failed', 'error');
        log('   Session management needs debugging');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { testBrowserLogin };
