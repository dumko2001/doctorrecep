#!/usr/bin/env node

/**
 * User Check Test
 * Checks if the test user exists and can be authenticated
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read environment variables
function loadEnvVars() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envVars = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    }
  }
  
  return envVars;
}

const envVars = loadEnvVars();

const config = {
  supabaseUrl: envVars.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: envVars.SUPABASE_SERVICE_ROLE_KEY,
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

async function checkUser() {
  log('👤 Checking User Status');
  log('='.repeat(30));
  
  const supabase = createClient(config.supabaseUrl, config.supabaseKey);
  
  // Check if user exists
  log('1. Checking if user exists...');
  const { data: user, error } = await supabase
    .from('doctors')
    .select('id, email, name, password_hash')
    .eq('email', config.testUser.email)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      log('❌ User does not exist in database', 'error');
      log('   Please sign up first at http://localhost:3000/signup');
      return false;
    } else {
      log(`❌ Database error: ${error.message}`, 'error');
      return false;
    }
  }
  
  log(`✅ User found: ${user.name} (${user.email})`);
  log(`   User ID: ${user.id}`);
  
  // Check password
  log('2. Checking password...');
  try {
    const isValidPassword = await bcrypt.compare(config.testUser.password, user.password_hash);
    
    if (isValidPassword) {
      log('✅ Password is correct');
    } else {
      log('❌ Password is incorrect', 'error');
      log('   The password in the database does not match the test password');
      return false;
    }
  } catch (error) {
    log(`❌ Password check error: ${error.message}`, 'error');
    return false;
  }
  
  log('='.repeat(30));
  log('📊 User Check Summary:');
  log('   ✅ User exists in database');
  log('   ✅ Password is correct');
  log('   ✅ Ready for login testing');
  
  return true;
}

// Run check
if (require.main === module) {
  checkUser()
    .then(success => {
      if (success) {
        log('');
        log('🎉 User is ready for testing!', 'success');
        log('   You can now test login at http://localhost:3000/login');
      } else {
        log('');
        log('⚠️  User setup needs attention', 'error');
        log('   Please sign up first or check credentials');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { checkUser };
