#!/usr/bin/env node

/**
 * Migration Setup Verification Script
 * Verifies all environment variables and configurations are ready for the storage URL migration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Migration Setup...\n');

// Check environment variables
function checkEnvVars() {
  console.log('📋 Checking Environment Variables:');
  
  const frontendEnvPath = path.join(__dirname, '..', '.env.local');
  const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
  
  let frontendEnv = {};
  let backendEnv = {};
  
  // Read frontend env
  if (fs.existsSync(frontendEnvPath)) {
    const content = fs.readFileSync(frontendEnvPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length > 0) {
        frontendEnv[key.trim()] = value.join('=').trim();
      }
    });
  }
  
  // Read backend env
  if (fs.existsSync(backendEnvPath)) {
    const content = fs.readFileSync(backendEnvPath, 'utf8');
    content.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length > 0) {
        backendEnv[key.trim()] = value.join('=').trim();
      }
    });
  }
  
  // Required frontend variables
  const requiredFrontend = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SESSION_SECRET',
    'NEXT_PUBLIC_API_URL'
  ];
  
  // Required backend variables
  const requiredBackend = [
    'GEMINI_API_KEY',
    'FRONTEND_URL'
  ];
  
  let allGood = true;
  
  console.log('  Frontend (.env.local):');
  requiredFrontend.forEach(key => {
    const exists = frontendEnv[key] && frontendEnv[key] !== '';
    console.log(`    ${exists ? '✅' : '❌'} ${key}: ${exists ? 'Set' : 'Missing'}`);
    if (!exists) allGood = false;
  });
  
  console.log('  Backend (.env):');
  requiredBackend.forEach(key => {
    const exists = backendEnv[key] && backendEnv[key] !== '';
    console.log(`    ${exists ? '✅' : '❌'} ${key}: ${exists ? 'Set' : 'Missing'}`);
    if (!exists) allGood = false;
  });
  
  return allGood;
}

// Check Python dependencies
function checkPythonDeps() {
  console.log('\n🐍 Checking Python Dependencies:');
  
  const requirementsPath = path.join(__dirname, '..', 'backend', 'requirements.txt');
  
  if (!fs.existsSync(requirementsPath)) {
    console.log('  ❌ requirements.txt not found');
    return false;
  }
  
  const requirements = fs.readFileSync(requirementsPath, 'utf8');
  const requiredPackages = ['google-generativeai', 'requests'];
  
  let allGood = true;
  requiredPackages.forEach(pkg => {
    const exists = requirements.includes(pkg);
    console.log(`  ${exists ? '✅' : '❌'} ${pkg}: ${exists ? 'Listed' : 'Missing'}`);
    if (!exists) allGood = false;
  });
  
  return allGood;
}

// Check migration files
function checkMigrationFiles() {
  console.log('\n📁 Checking Migration Files:');
  
  const files = [
    'database/migrate-to-storage-urls.sql',
    'backend/src/summarize_gemini_storage.py',
    'src/lib/storage.ts'
  ];
  
  let allGood = true;
  files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(filePath);
    console.log(`  ${exists ? '✅' : '❌'} ${file}: ${exists ? 'Ready' : 'Missing'}`);
    if (!exists) allGood = false;
  });
  
  return allGood;
}

// Check Supabase Storage buckets (instructions)
function checkStorageInstructions() {
  console.log('\n🪣 Supabase Storage Buckets:');
  console.log('  ℹ️  Please verify these buckets exist in your Supabase project:');
  console.log('    📁 consultation-audio (with RLS policies)');
  console.log('    📁 consultation-images (with RLS policies)');
  console.log('  ℹ️  RLS Policies should allow:');
  console.log('    - service_role: INSERT (for uploads)');
  console.log('    - public: SELECT (for downloads)');
  
  return true; // Can't verify automatically
}

// Main verification
function main() {
  const envCheck = checkEnvVars();
  const pythonCheck = checkPythonDeps();
  const filesCheck = checkMigrationFiles();
  const storageCheck = checkStorageInstructions();
  
  console.log('\n📊 Summary:');
  console.log(`  Environment Variables: ${envCheck ? '✅ Ready' : '❌ Issues found'}`);
  console.log(`  Python Dependencies: ${pythonCheck ? '✅ Ready' : '❌ Issues found'}`);
  console.log(`  Migration Files: ${filesCheck ? '✅ Ready' : '❌ Issues found'}`);
  console.log(`  Storage Setup: ℹ️  Manual verification needed`);
  
  if (envCheck && pythonCheck && filesCheck) {
    console.log('\n🎉 Migration setup looks good! You can proceed with:');
    console.log('   1. Run the database migration: psql -f database/migrate-to-storage-urls.sql');
    console.log('   2. Install Python deps: cd backend && pip install -r requirements.txt');
    console.log('   3. Test the new file-based workflow');
  } else {
    console.log('\n⚠️  Please fix the issues above before proceeding with migration.');
  }
}

main();
