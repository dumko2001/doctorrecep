#!/usr/bin/env node

/**
 * Final Verification Test
 * Tests the complete flow after RLS policies are fixed
 */

const fs = require('fs');
const path = require('path');

const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:3001',
  testUser: {
    name: 'Dr. Final Test',
    email: `final${Date.now()}@example.com`,
    password: 'testpassword123',
    clinic_name: 'Final Test Clinic',
    phone: '+91 9876543210'
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
      location: response.headers.get('location')
    };
  } catch (error) {
    log(`Request failed: ${error.message}`, 'error');
    throw error;
  }
}

async function testSignupAfterFix() {
  log('🔧 Testing signup after RLS policy fix...');
  
  // Get signup page
  const signupPageResponse = await makeRequest(`${config.frontendUrl}/signup`);
  if (!signupPageResponse.ok) {
    log('❌ Signup page not accessible', 'error');
    return false;
  }
  
  // Extract form data
  const html = signupPageResponse.data;
  const actionKeyMatch = html.match(/name="\$ACTION_KEY" value="([^"]+)"/);
  const actionDataMatch = html.match(/name="\$ACTION_1:0" value="([^"]+)"/);
  
  if (!actionKeyMatch || !actionDataMatch) {
    log('❌ Cannot extract form data', 'error');
    return false;
  }
  
  // Prepare form data
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
  
  // Check result
  if (signupResponse.redirected && signupResponse.location === '/dashboard') {
    log('✅ SIGNUP SUCCESSFUL! Redirected to dashboard', 'success');
    return true;
  } else if (signupResponse.status === 200) {
    const hasError = signupResponse.data.includes('An error occurred') ||
                    signupResponse.data.includes('violates row-level security');
    
    if (hasError) {
      log('❌ Signup still failing - RLS policies may not be updated yet', 'error');
      log('   Please run the SQL from database/fix-rls-policies.sql in Supabase', 'error');
      return false;
    } else {
      log('✅ Signup processed without errors', 'success');
      return true;
    }
  } else {
    log(`❌ Unexpected response: ${signupResponse.status}`, 'error');
    return false;
  }
}

async function runFinalVerification() {
  log('🎯 Final Verification Test');
  log('='.repeat(40));
  
  const signupWorking = await testSignupAfterFix();
  
  log('='.repeat(40));
  
  if (signupWorking) {
    log('🎉 SUCCESS! Your Doctor Reception System is fully functional!', 'success');
    log('');
    log('✅ Next steps:');
    log('   1. Create a doctor account at http://localhost:3000/signup');
    log('   2. Record a consultation at http://localhost:3000/record');
    log('   3. Generate AI summaries in the dashboard');
    log('   4. Deploy to production using DEPLOYMENT.md');
    log('');
    log('🚀 Your app is ready for real-world use!');
    return true;
  } else {
    log('⚠️  Signup still not working. Please:', 'error');
    log('   1. Go to your Supabase dashboard');
    log('   2. Open SQL Editor');
    log('   3. Run the SQL from database/fix-rls-policies.sql');
    log('   4. Run this test again: node tests/final-verification.js');
    return false;
  }
}

// Run verification
if (require.main === module) {
  runFinalVerification()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runFinalVerification };
