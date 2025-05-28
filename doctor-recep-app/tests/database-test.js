#!/usr/bin/env node

/**
 * Database Connection Test
 * Tests direct database operations to verify Supabase setup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local
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

// Test configuration
const config = {
  supabaseUrl: envVars.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: envVars.SUPABASE_SERVICE_ROLE_KEY, // Use service role to bypass RLS
  testUser: {
    name: 'Dr. Database Test',
    email: `dbtest${Date.now()}@example.com`,
    password_hash: '$2a$10$test.hash.for.testing.purposes.only',
    clinic_name: 'Test Clinic',
    phone: '+91 9876543210'
  }
};

let testResults = { passed: 0, failed: 0, tests: [] };

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

async function testDatabaseConnection() {
  log('Testing database connection...');

  assert(config.supabaseUrl, 'Supabase URL is configured');
  assert(config.supabaseKey, 'Supabase service role key is configured');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // Test basic connection
  const { data, error } = await supabase
    .from('doctors')
    .select('count')
    .limit(1);

  assert(!error, `Database connection successful: ${error?.message || 'OK'}`);
  log('Database connection established successfully');
}

async function testTableStructure() {
  log('Testing table structure...');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // Test doctors table structure
  const { data: doctorsData, error: doctorsError } = await supabase
    .from('doctors')
    .select('*')
    .limit(0); // Just get structure, no data

  assert(!doctorsError, `Doctors table accessible: ${doctorsError?.message || 'OK'}`);

  // Test consultations table structure
  const { data: consultationsData, error: consultationsError } = await supabase
    .from('consultations')
    .select('*')
    .limit(0);

  assert(!consultationsError, `Consultations table accessible: ${consultationsError?.message || 'OK'}`);
}

async function testDoctorInsert() {
  log('Testing doctor insert operation...');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // Try to insert a test doctor
  const { data, error } = await supabase
    .from('doctors')
    .insert(config.testUser)
    .select('id')
    .single();

  if (error) {
    log(`Insert error: ${error.message}`, 'error');
    log(`Error code: ${error.code}`, 'error');
    log(`Error details: ${JSON.stringify(error.details)}`, 'error');

    if (error.code === '42501') {
      log('RLS policy is blocking the insert - this needs to be fixed in Supabase', 'error');
      assert(false, 'RLS policies need to be updated in Supabase dashboard');
    } else {
      assert(false, `Doctor insert failed: ${error.message}`);
    }
  } else {
    assert(data && data.id, 'Doctor insert successful');
    log(`Created doctor with ID: ${data.id}`);

    // Clean up - delete the test doctor
    const { error: deleteError } = await supabase
      .from('doctors')
      .delete()
      .eq('id', data.id);

    if (!deleteError) {
      log('Test doctor cleaned up successfully');
    }
  }
}

async function testConsultationInsert() {
  log('Testing consultation insert operation...');

  const supabase = createClient(config.supabaseUrl, config.supabaseKey);

  // First, create a test doctor
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .insert(config.testUser)
    .select('id')
    .single();

  if (doctorError) {
    log('Skipping consultation test - cannot create test doctor', 'info');
    return;
  }

  // Try to insert a test consultation
  const testConsultation = {
    doctor_id: doctor.id,
    audio_base64: 'test_audio_data',
    images_base64: ['test_image_1', 'test_image_2'],
    submitted_by: 'doctor',
    status: 'pending'
  };

  const { data: consultation, error: consultationError } = await supabase
    .from('consultations')
    .insert(testConsultation)
    .select('id, patient_number')
    .single();

  if (consultationError) {
    log(`Consultation insert error: ${consultationError.message}`, 'error');
    assert(false, `Consultation insert failed: ${consultationError.message}`);
  } else {
    assert(consultation && consultation.id, 'Consultation insert successful');
    assert(consultation.patient_number > 0, 'Patient number auto-generated');
    log(`Created consultation with ID: ${consultation.id}, Patient #: ${consultation.patient_number}`);
  }

  // Clean up
  await supabase.from('consultations').delete().eq('doctor_id', doctor.id);
  await supabase.from('doctors').delete().eq('id', doctor.id);
  log('Test data cleaned up');
}

async function runDatabaseTests() {
  log('🗄️  Starting Database Tests');
  log('='.repeat(40));

  const tests = [
    testDatabaseConnection,
    testTableStructure,
    testDoctorInsert,
    testConsultationInsert
  ];

  for (const test of tests) {
    try {
      await test();
      log(`✅ ${test.name} completed successfully`);
    } catch (error) {
      log(`❌ ${test.name} failed: ${error.message}`, 'error');
    }
    log('-'.repeat(25));
  }

  // Print summary
  log('='.repeat(40));
  log(`📊 Database Test Summary:`);
  log(`   Passed: ${testResults.passed}`);
  log(`   Failed: ${testResults.failed}`);
  log(`   Total:  ${testResults.passed + testResults.failed}`);

  if (testResults.failed === 0) {
    log('🎉 All database tests passed!', 'success');
  } else {
    log(`⚠️  ${testResults.failed} database test(s) failed`, 'error');
    log('');
    log('🔧 To fix RLS issues:');
    log('   1. Go to your Supabase dashboard');
    log('   2. Open SQL Editor');
    log('   3. Run the SQL from: database/fix-rls-policies.sql');
  }

  return testResults.failed === 0;
}

// Run tests if called directly
if (require.main === module) {
  runDatabaseTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runDatabaseTests, config };
